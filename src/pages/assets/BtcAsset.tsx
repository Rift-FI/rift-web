import { JSX } from "react";
import { useNavigate } from "react-router";
import {
  faCircleArrowUp,
  faCirclePlus,
} from "@fortawesome/free-solid-svg-icons";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { useTabs } from "../../hooks/tabs";
import { useAppDrawer } from "../../hooks/drawer";
import { formatUsd, formatNumber } from "../../utils/formatters";
import { SubmitButton } from "../../components/global/Buttons";
import { FaIcon } from "../../assets/faicon";
import { Copy, Telegram } from "../../assets/icons/actions";
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

  const walletAddress = localStorage.getItem("btcaddress");
  const btcbal = localStorage.getItem("btcbal");
  const btcbalUsd = localStorage.getItem("btcbalUsd");

  const onCopyAddr = () => {
    if (walletAddress !== null) {
      navigator.clipboard.writeText(walletAddress as string);
      showsuccesssnack("Address copied to clipboard");
    }
  };

  const onSendBtc = () => {
    localStorage.setItem("prev_page", "/btc-asset");
    navigate("/send-crypto/BTC/send");
  };

  const onSendBtcLink = () => {
    localStorage.setItem("prev_page", "/btc-asset");
    navigate("/sendcollectlink/BTC/send");
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
        <CreateNewKey />
      </div>

      <div className="actions">
        <p>
          You can Send BTC directly to an address or create a link that allows
          other users to collect BTC from your wallet
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
              borderRadius: "2rem",
              backgroundColor: colors.divider,
            }}
            onclick={onSendBtcLink}
          />
          <SubmitButton
            text="Send BTC"
            icon={
              <FaIcon faIcon={faCircleArrowUp} color={colors.textprimary} />
            }
            sxstyles={{
              width: "62%",
              borderRadius: "2rem",
            }}
            onclick={onSendBtc}
          />
        </div>
      </div>
    </section>
  );
}

export const CreateNewKey = (): JSX.Element => {
  const { openAppDrawer } = useAppDrawer();

  return (
    <SubmitButton
      text="Create New Key"
      sxstyles={{
        width: "fit-content",
        marginTop: "0.75rem",
        padding: "0.5rem 1.5rem",
        border: `1px solid ${colors.divider}`,
        borderRadius: "1rem",
        backgroundColor: colors.divider,
      }}
      icon={<FaIcon faIcon={faCirclePlus} color={colors.textprimary} />}
      onclick={() => openAppDrawer("createkey")}
    />
  );
};
