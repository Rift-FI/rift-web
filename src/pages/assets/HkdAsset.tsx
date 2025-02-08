import { JSX, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
// import { useSnackbar } from "../../hooks/snackbar";
import { formatUsd, formatNumber } from "../../utils/formatters";
import { Send } from "../../assets/icons/actions";
import { colors } from "../../constants";
import btclogo from "../../assets/images/btc.png";
import "../../styles/pages/assets/assets.scss";

export default function HkdAsset(): JSX.Element {
  const navigate = useNavigate();
  const { balance } = useParams();
  // const { showsuccesssnack } = useSnackbar();

  const goBack = () => {
    navigate("/all-assets");
  };

  // let walletAddress = localStorage.getItem("btcaddress");
  // let btcbal = localStorage.getItem("btcbal");
  // let btcbalUsd = localStorage.getItem("btcbalUsd");

  // const onCopyAddr = () => {
  //   if (walletAddress !== null) {
  //     navigator.clipboard.writeText(walletAddress as string);
  //     showsuccesssnack("Address copied to clipboard");
  //   }
  // };

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
    <section id="btc-asset">
      <img src={btclogo} alt="btc" />

      {/* <button className="address" onClick={onCopyAddr}>
        {walletAddress?.substring(0, 3)}...{walletAddress?.substring(4, 7)}
        <Copy width={14} height={16} color={colors.textsecondary} />
      </button> */}

      <div className="balance">
        <p>{formatUsd(Number(balance) / 7.79)}</p>
        <span>{formatNumber(Number(balance))} BTC</span>
      </div>

      <div className="actions">
        <p>Send HKD</p>

        <span className="divider" />

        <div className="buttons">
          {/* <button className="receive" onClick={onCopyAddr}>
            Receive
            <Receive width={18} height={18} color={colors.textprimary} />
          </button> */}

          <button className="send" onClick={() => navigate("/send-btc/send")}>
            Send BTC <Send width={18} height={18} color={colors.textprimary} />
          </button>
        </div>
      </div>
    </section>
  );
}
