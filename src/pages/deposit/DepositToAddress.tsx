import { JSX, MouseEvent, useState } from "react";
import { useNavigate } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { useSnackbar } from "../../hooks/snackbar";
import { PopOver } from "../../components/global/PopOver";
import { useBackButton } from "../../hooks/backbutton";
import { assetType } from "../lend/CreateLendAsset";
import { colors } from "../../constants";
import { Copy } from "../../assets/icons/actions";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";
import usdclogo from "../../assets/images/labs/usdc.png";
import "../../styles/pages/deposit/deposittoaddres.scss";

export default function DepositToAddress(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack } = useSnackbar();

  const [depositAsset, setDepositAsset] =
    useState<Exclude<assetType, "HKD" | "USD" | "HKDA">>("OM");
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);

  const btcaddress = localStorage.getItem("btcaddress") as string;
  const ethaddress = localStorage.getItem("ethaddress") as string;

  const onCopyAddr = () => {
    if (depositAsset == "BTC") {
      navigator.clipboard.writeText(btcaddress);
    } else {
      navigator.clipboard.writeText(ethaddress);
    }
    showsuccesssnack("Address copied to clipboard");
  };

  const goBack = () => {
    navigate("/deposit");
  };

  const openAssetPopOver = (event: MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  useBackButton(goBack);

  return (
    <section id="" className="bg-[#0e0e0e] h-screen px-4 pb-20 overflow-y-auto">
      <p className="text-xl text-[#f6f7f9] font-bold text-center mt-8">
        Deposit from external network
      </p>
      <span className="text-sm text-gray-400 my-2 text-center">
        Deposit funds to you Sphere wallet
      </span>

      <p className="text-[#f6f7f9] font-bold mt-8">Choose an asset</p>
      <span className="text-sm text-gray-400 mb-8">
        What crypto asset would you like to deposit ?
      </span>

      <div className="mt-4" onClick={openAssetPopOver}>
        <div className="flex items-center gap-2 bg-[#222222] rounded-2xl p-2 mb-4">
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
            className="w-10 h-10 rounded-full"
            alt="asset"
          />

          <p className="text-sm text-[#f6f7f9] font-bold">
            {depositAsset} <br />
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

        {/* <span className="inv_icon">
          <ChevronLeft width={6} height={11} color={colors.textsecondary} />
        </span> */}
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

      <p className="text-[#f6f7f9] font-bold mt-8 mb-2">Deposit Address</p>
      <button
        className="flex items-center gap-2 mb-8 justify-between text-sm text-gray-400 w-full"
        onClick={onCopyAddr}
      >
        {depositAsset == "BTC"
          ? btcaddress?.substring(0, 16) + "..."
          : ethaddress?.substring(0, 16) + "..."}
        <span className="flex text-sm text-gray-400 items-center gap-1">
          Copy
          <Copy width={12} height={14} color={"#ffb386"} />
        </span>
      </button>

      <div className="flex items-center justify-center">
        <div className="bg-[#222222] rounded-2xl p-2">
          <QRCodeSVG
            value={depositAsset == "BTC" ? btcaddress : ethaddress}
            bgColor={colors.textprimary}
            fgColor={colors.primary}
            style={{ borderRadius: "0.5rem" }}
          />
        </div>
      </div>

      <p className="text-sm text-gray-400 mt-4 text-center flex flex-col gap-2">
        Copy your {depositAsset} address or scan the Qr Code to deposit
        <span className="text-sm text-gray-400">
          Please use this address only to deposit {depositAsset}
        </span>
      </p>
    </section>
  );
}
