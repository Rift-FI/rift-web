import { JSX } from "react";
import { useNavigate, useParams } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { useTabs } from "../../hooks/tabs";
import { formatUsd, formatNumber } from "../../utils/formatters";
import { SubmitButton } from "../../components/global/Buttons";
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

  useBackButton(goBack);

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
            onclick={() => navigate(`/sendcollectlink/ETH/${intent}`)}
          />
          <SubmitButton
            text="Send ETH"
            icon={<Send width={18} height={18} color={colors.textprimary} />}
            sxstyles={{
              width: "62%",
              borderRadius: "2rem",
            }}
            onclick={() => navigate(`/send-crypto/ETH/${intent}`)}
          />
        </div>
      </div>
    </section>
  );
}
