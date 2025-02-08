import { JSX, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { useSnackbar } from "../../hooks/snackbar";
import { useTabs } from "../../hooks/tabs";
import { formatUsd, formatNumber } from "../../utils/formatters";
import { Copy, Send, Telegram } from "../../assets/icons/actions";
import { colors } from "../../constants";
import ethlogo from "../../assets/images/eth.png";
import "../../styles/pages/assets/assets.scss";

export default function EthAsset(): JSX.Element {
  const navigate = useNavigate();
  const { intent } = useParams();
  const { showsuccesssnack } = useSnackbar();
  const { switchtab } = useTabs();

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  let walletAddress = localStorage.getItem("address");
  let ethbal = localStorage.getItem("ethbal");
  let ethbalUsd = localStorage.getItem("ethbalUsd");

  const onCopyAddr = () => {
    if (walletAddress !== null) {
      navigator.clipboard.writeText(walletAddress as string);
      showsuccesssnack("Address copied to clipboard");
    }
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
    <section id="eth-asset">
      <img src={ethlogo} alt="eth" />

      <button className="address" onClick={onCopyAddr}>
        {walletAddress?.substring(0, 3)}...{walletAddress?.substring(4, 7)}
        <Copy width={14} height={16} color={colors.textsecondary} />
      </button>

      <div className="balance">
        <p>{formatUsd(Number(ethbalUsd))}</p>
        <span>{formatNumber(Number(ethbal))} ETH</span>
      </div>

      <div className="actions">
        <p>
          You can Send Eth directly to an address or create a link that allows
          other users to collect ETH from your wallet
        </p>

        <span className="divider" />

        <div className="buttons">
          <button
            className="receive"
            onClick={() => navigate(`/sendcollectlink/${intent}`)}
          >
            Create Link
            <Telegram width={18} height={18} color={colors.textprimary} />
          </button>

          <button
            className="send"
            onClick={() => navigate(`/send-eth/${intent}`)}
          >
            Send ETH <Send width={18} height={18} color={colors.textprimary} />
          </button>
        </div>
      </div>
    </section>
  );
}
