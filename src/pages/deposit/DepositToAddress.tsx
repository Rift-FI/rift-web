import { JSX, MouseEvent, useEffect, useState } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { useSnackbar } from "../../hooks/snackbar";
import { PopOver } from "../../components/global/PopOver";
import { colors } from "../../constants";
import { assetType } from "../lend/CreateLendAsset";
import { ChevronLeft, Copy } from "../../assets/icons/actions";
import btclogo from "../../assets/images/btc.png";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import "../../styles/pages/paymentlinks/deposittoaddres.scss";

export default function DepositToAddress(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack } = useSnackbar();

  const [depositAsset, setDepositAsset] = useState<assetType>("BTC");
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);

  let btcaddress = localStorage.getItem("btcaddress") as string;
  let ethaddress = localStorage.getItem("address") as string;

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

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(goBack);
    }

    return () => {
      backButton.offClick(goBack);
      backButton.unmount();
    };
  }, []);

  return (
    <section id="linkgenerator">
      <p className="title">
        Deposit from external network
        <span>Deposit funds to you Sphere wallet</span>
      </p>

      <p className="title_desc">
        Choose an asset
        <span>Waht crypto asset would you like to deposit ?</span>
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
            {depositAsset} <br />
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
        {
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

            <p className="asset_tle">
              Select an asset you would like to be paid
            </p>
          </div>
        }
      </PopOver>

      <p className="asset_title">Deposit Address</p>
      <button className="copylink" onClick={onCopyAddr}>
        {depositAsset == "BTC"
          ? btcaddress?.substring(0, 16) + "..."
          : ethaddress?.substring(0, 16) + "..."}
        <span>
          Copy
          <Copy width={12} height={14} color={colors.textsecondary} />
        </span>
      </button>

      <div className="qr_ctr">
        <div className="_qr">
          <QRCodeSVG
            value={depositAsset == "BTC" ? btcaddress : ethaddress}
            bgColor={colors.textprimary}
            fgColor={colors.primary}
            style={{ borderRadius: "0.5rem" }}
          />
        </div>
      </div>

      <p className="text_warning">
        Copy your {depositAsset} address or scan the Qr Code to deposit
        <span>Please use this address only to deposit {depositAsset}</span>
      </p>
    </section>
  );
}
