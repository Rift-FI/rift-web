import { JSX } from "react";
import { useNavigate } from "react-router";
import { faCircleArrowUp } from "@fortawesome/free-solid-svg-icons";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { useTabs } from "../../hooks/tabs";
import { formatUsd, formatNumber } from "../../utils/formatters";
import { MantraButton, SubmitButton } from "../../components/global/Buttons";
import { FaIcon } from "../../assets/faicon";
import { Copy } from "../../assets/icons/actions";
import { colors } from "../../constants";
import usdclogo from "../../assets/images/labs/mantralogo.jpeg";
import "../../styles/pages/assets/assets.scss";

export default function OmAsset(): JSX.Element {
  const navigate = useNavigate();
  const { showsuccesssnack } = useSnackbar();
  const { switchtab } = useTabs();

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  const walletAddress = localStorage.getItem("ethaddress");
  const mantrabal = localStorage.getItem("mantrabal");
  const mantrabalusd = localStorage.getItem("mantrabalusd");

  const onCopyAddr = () => {
    if (walletAddress !== null) {
      navigator.clipboard.writeText(walletAddress as string);
      showsuccesssnack("Address copied to clipboard");
    }
  };

  const onSendOM = () => {
    localStorage.setItem("prev_page", "/om-asset");
    navigate("/send-crypto/OM/send");
  };

  useBackButton(goBack);

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
        <p>Send & buy OM</p>

        <span className="divider" />

        <div className="buttons">
          <SubmitButton
            text="Send"
            icon={
              <FaIcon faIcon={faCircleArrowUp} color={colors.textprimary} />
            }
            sxstyles={{
              width: "35%",
              padding: "0.5rem",
              borderRadius: "2rem",
              backgroundColor: colors.divider,
            }}
            onclick={onSendOM}
          />
          <MantraButton
            text="Get OM"
            sxstyles={{
              width: "62%",
              padding: "0.5rem",
              borderRadius: "2rem",
            }}
            onclick={() => navigate("/get-om")}
          />
        </div>
      </div>
    </section>
  );
}
