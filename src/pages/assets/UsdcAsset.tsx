import { JSX } from "react";
import { useNavigate, useParams } from "react-router";
import { faCircleArrowUp } from "@fortawesome/free-solid-svg-icons";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { useTabs } from "../../hooks/tabs";
import { formatUsd, formatNumber } from "../../utils/formatters";
import { SubmitButton } from "../../components/global/Buttons";
import { CreateNewKey } from "./BtcAsset";
import { Copy, Telegram } from "../../assets/icons/actions";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import usdclogo from "../../assets/images/labs/usdc.png";
import "../../styles/pages/assets/assets.scss";

export default function UsdcAsset(): JSX.Element {
  const navigate = useNavigate();
  const { intent } = useParams();
  const { showsuccesssnack } = useSnackbar();
  const { switchtab } = useTabs();

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  const walletAddress = localStorage.getItem("ethaddress");
  const ethbal = localStorage.getItem("usdcbal");

  const onCopyAddr = () => {
    if (walletAddress !== null) {
      navigator.clipboard.writeText(walletAddress as string);
      showsuccesssnack("Address copied to clipboard");
    }
  };

  const onSendUSDC = () => {
    localStorage.setItem("prev_page", `/usdc-asset/${intent}`);
    navigate(`/send-crypto/USDC/${intent}`);
  };

  const onSendUSDCLink = () => {
    localStorage.setItem("prev_page", `/usdc-asset/${intent}`);
    navigate(`/sendcollectlink/USDC/${intent}`);
  };

  useBackButton(goBack);

  return (
    <section id="eth-asset">
      <img src={usdclogo} alt="eth" />

      <button className="address" onClick={onCopyAddr}>
        {walletAddress?.substring(0, 3)}...{walletAddress?.substring(4, 7)}
        <Copy width={14} height={16} color={colors.textsecondary} />
      </button>

      <div className="balance">
        <p>{formatUsd(Number(ethbal))}</p>
        <span>{formatNumber(Number(ethbal))} USDC</span>
        <CreateNewKey />
      </div>

      <div className="actions">
        <p>
          You can Send USDC directly to an address or create a link that allows
          other users to collect USDC from your wallet
        </p>

        <span className="divider" />

        <div className="buttons">
          <SubmitButton
            text="Create Link"
            icon={
              <Telegram width={18} height={18} color={colors.textprimary} />
            }
            sxstyles={{
              width: "35%",
              padding: "0.5rem",
              borderRadius: "2rem",
              backgroundColor: colors.divider,
            }}
            onclick={onSendUSDCLink}
          />
          <SubmitButton
            text="Send USDC"
            icon={
              <FaIcon faIcon={faCircleArrowUp} color={colors.textprimary} />
            }
            sxstyles={{
              width: "62%",
              padding: "0.5rem",
              borderRadius: "2rem",
            }}
            onclick={onSendUSDC}
          />
        </div>
      </div>
    </section>
  );
}
