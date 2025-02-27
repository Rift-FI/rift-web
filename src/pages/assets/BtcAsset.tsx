import { JSX } from "react";
import { useNavigate } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { useTabs } from "../../hooks/tabs";
import { formatUsd, formatNumber } from "../../utils/formatters";
import { Copy, Send, Telegram } from "../../assets/icons/actions";
import { colors } from "../../constants";
import btclogo from "../../assets/images/btc.png";
import "../../styles/pages/assets/assets.scss";

export default function BtcAsset(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { showsuccesssnack } = useSnackbar();

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  let walletAddress = localStorage.getItem("btcaddress");
  let btcbal = localStorage.getItem("btcbal");
  let btcbalUsd = localStorage.getItem("btcbalUsd");

  const onCopyAddr = () => {
    if (walletAddress !== null) {
      navigator.clipboard.writeText(walletAddress as string);
      showsuccesssnack("Address copied to clipboard");
    }
  };

  useBackButton(goBack);

  return (
    <section id="btc-asset">
      <img src={btclogo} alt="btc" />

      <button className="address" onClick={onCopyAddr}>
        {walletAddress?.substring(0, 3)}...{walletAddress?.substring(4, 7)}
        <Copy width={14} height={16} color={colors.textsecondary} />
      </button>

      <div className="balance">
        <p>{formatUsd(Number(btcbalUsd))}</p>
        <span>{formatNumber(Number(btcbal))} BTC</span>
      </div>

      <div className="actions">
        <p>
          You can Send BTC directly to an address or create a link that allows
          other users to collect BTC from your wallet
        </p>

        <span className="divider" />

        <div className="buttons">
          <button
            className="receive"
            onClick={() => navigate("/sendcollectlink/BTC/send")}
          >
            Create Link
            <Telegram width={18} height={18} color={colors.textprimary} />
          </button>

          <button
            className="send"
            onClick={() => navigate("/send-crypto/BTC/send")}
          >
            Send BTC <Send width={18} height={18} color={colors.textprimary} />
          </button>
        </div>
      </div>
    </section>
  );
}
