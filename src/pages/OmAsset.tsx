import { JSX, useEffect } from "react";
import { useNavigate } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { useSnackbar } from "../hooks/snackbar";
import { useTabs } from "../hooks/tabs";
import { formatUsd, formatNumber } from "../utils/formatters";
import { Copy, Receive } from "../assets/icons/actions";
import { colors } from "../constants";
import usdclogo from "../assets/images/labs/mantralogo.jpeg";
import "../styles/pages/assets.scss";

export default function OmAsset(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack } = useSnackbar();
  const { switchtab } = useTabs();

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  let walletAddress = localStorage.getItem("address");
  let mantrabal = localStorage.getItem("mantrabal");
  let mantrabalusd = localStorage.getItem("mantrabalusd");

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
    <section id="om-asset">
      <img src={usdclogo} alt="usdt" />

      <button className="address" onClick={onCopyAddr}>
        {walletAddress?.substring(0, 3)}...{walletAddress?.substring(4, 7)}
        <Copy width={14} height={16} color={colors.textsecondary} />
      </button>

      <div className="balance">
        <p>{formatUsd(Number(mantrabalusd))}</p>
        <span>{formatNumber(Number(mantrabal))} OM</span>
      </div>

      <div className="actions">
        <p>Receive & buy OM</p>

        <span className="divider" />

        <div className="buttons">
          <button className="receive" onClick={onCopyAddr}>
            Receive
            <Receive width={18} height={18} color={colors.textprimary} />
          </button>

          <button className="send" onClick={() => navigate("/get-om")}>
            Get OM
          </button>
        </div>
      </div>
    </section>
  );
}
