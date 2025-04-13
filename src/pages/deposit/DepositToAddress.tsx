import { JSX, MouseEvent, useState } from "react";
import { useNavigate } from "react-router";

import { useSnackbar } from "../../hooks/snackbar";
import { PopOver } from "../../components/global/PopOver";
import { useBackButton } from "../../hooks/backbutton";

import { Copy } from "../../assets/icons/actions";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import beralogo from "../../assets/images/icons/bera.webp";

// Define network info type
type NetworkInfo = {
  name: string;
  warning: string;
  contractAddress?: string;
};

export default function DepositToAddress(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack } = useSnackbar();

  // Updated state type to include WUSDC
  const [depositAsset, setDepositAsset] = useState<
    "WBERA" | "ETH" | "USDC" | "WUSDC"
  >("ETH");
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);

  const ethaddress = localStorage.getItem("ethaddress") as string;

  const onCopyAddr = () => {
    navigator.clipboard.writeText(ethaddress);
    showsuccesssnack("Address copied to clipboard");
  };

  const goBack = () => {
    navigate("/deposit");
  };

  // Updated getNetworkInfo to handle WUSDC
  const getNetworkInfo = (asset: typeof depositAsset): NetworkInfo => {
    switch (asset) {
      case "WBERA":
        return {
          name: "Berachain", // Updated network name
          warning: "Only send WBERA to this address on the Berachain network.",
          contractAddress: "0x6969696969696969696969696969696969696969", // Placeholder, update if known
        };
      case "USDC":
        return {
          name: "Polygon Mainnet",
          warning:
            "Only send USDC (PoS) to this address on the Polygon Mainnet.",
          contractAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        };
      case "WUSDC": // Added WUSDC case
        return {
          name: "Berachain",
          warning: "Only send USDC to this address on the Berachain network.",
          contractAddress: "0x549943e04f40284185054145c6E4e9568C1D3241", // Updated WUSDC contract
        };
      case "ETH":
      default:
        return {
          name: "Ethereum Mainnet (ERC20)",
          warning:
            "Only send ETH (ERC20) to this address on the Ethereum Mainnet.",
        };
    }
  };
  const networkInfo = getNetworkInfo(depositAsset);

  const openAssetPopOver = (event: MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  useBackButton(goBack);

  // Applied theme and scrolling layout structure
  return (
    <div className="flex flex-col h-screen bg-[#0e0e0e] text-[#f6f7f9]">
      {/* Scrollable Content Area */}
      <div className="flex-grow overflow-y-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center mt-8">
          <p className="text-xl text-[#f6f7f9] font-bold">
            Deposit {depositAsset}
          </p>
          <span className="text-sm text-gray-400 my-2 block">
            Deposit {depositAsset} to your Sphere wallet using the address
            below.
          </span>
        </div>

        {/* Asset Selector Section */}
        <div>
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
                  {depositAsset}
                </p>
                <span className="text-xs text-gray-400">
                  {
                    depositAsset == "WBERA"
                      ? "Berachain"
                      : depositAsset == "ETH"
                      ? "Ethereum"
                      : depositAsset == "USDC"
                      ? "USD Coin (Polygon)"
                      : "USD Coin (Berachain)" // WUSDC
                  }
                </span>
              </div>
            </div>
            {/* Add Chevron Down Icon */}
            {/* <FaIcon faIcon={faChevronDown} color="#9ca3af" /> */}
          </div>
        </div>

        {/* PopOver for Asset Selection - Added WUSDC */}
        <PopOver anchorEl={anchorEl} setAnchorEl={setAnchorEl}>
          <div className="bg-[#2a2e2c] p-2 rounded-lg shadow-lg border border-[#34404f] w-60">
            {[
              { id: "WBERA", name: "Berachain", logo: beralogo },
              { id: "ETH", name: "Ethereum", logo: ethlogo },
              { id: "USDC", name: "USD Coin (Polygon)", logo: usdclogo },
              { id: "WUSDC", name: "USD Coin (Berachain)", logo: usdclogo }, // Added WUSDC option
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
                    {asset.id}
                  </p>
                  <p className="text-gray-400 text-xs">{asset.name}</p>
                </div>
              </div>
            ))}
          </div>
        </PopOver>

        {/* Deposit Address Section */}
        <div>
          <p className="text-[#f6f7f9] font-medium mb-2">
            Deposit Address (Network: {networkInfo.name})
          </p>
          <div
            className="flex items-center justify-between p-3 bg-[#2a2e2c] rounded-xl border border-[#34404f] text-sm text-gray-400 w-full cursor-pointer hover:bg-[#34404f]"
            onClick={onCopyAddr}
          >
            <span>
              {ethaddress?.substring(0, 8) + "..." + ethaddress?.slice(-8)}
            </span>
            <span className="flex items-center gap-1 text-sm text-[#ffb386]">
              Copy
              <Copy width={12} height={14} color="#ffb386" />
            </span>
          </div>
        </div>

        {/* Network Info/Warning Section */}
        <div className="p-4 bg-[#2a2e2c] rounded-xl border border-yellow-500/50">
          <p className="text-sm text-yellow-400 font-semibold text-center">
            Important: Network Information
          </p>
          <p className="text-sm text-gray-300 mt-2 text-center">
            {networkInfo.warning} Sending assets on the wrong network may result
            in permanent loss of funds.
          </p>
          {networkInfo.contractAddress && (
            <p className="text-xs text-gray-400 mt-2 text-center break-all">
              Ensure you are interacting with the correct token contract: <br />
              <strong className="text-gray-200">
                {networkInfo.contractAddress}
              </strong>
            </p>
          )}
          <p className="text-xs text-gray-400 mt-3 text-center">
            Deposit only {depositAsset} to this address via the{" "}
            <strong className="text-gray-200">{networkInfo.name}</strong>{" "}
            network.
          </p>
        </div>
      </div>{" "}
      {/* End Scrollable Content Area */}
    </div>
  );
}
