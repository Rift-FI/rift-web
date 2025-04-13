import { JSX } from "react";
import { useNavigate } from "react-router";
import { useTabs } from "../../hooks/tabs";
import { useSnackbar } from "../../hooks/snackbar";
import { useBackButton } from "../../hooks/backbutton";
import { useAppDrawer } from "../../hooks/drawer";
import { SubmitButton } from "../../components/global/Buttons";
import { Telegram, Copy } from "../../assets/icons/actions";
import { FaIcon } from "../../assets/faicon";
import {
  faCircleArrowUp,
  faCirclePlus,
} from "@fortawesome/free-solid-svg-icons";
import { colors } from "../../constants";
import { formatUsd, formatNumber } from "../../utils/formatters";
import btclogo from "../../assets/images/btc.png";

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
    <section className="min-h-screen bg-[#0e0e0e] px-4 py-6 pb-24">
      {/* Header Section */}
      <div className="flex flex-col items-center text-center mb-8">
        <img src={btclogo} alt="btc" className="w-16 h-16 mb-4" />

        {/* Address Section */}
        <button
          className="flex items-center gap-2 px-4 py-2 bg-[#212121] rounded-full text-[#f6f7f9] hover:bg-[#2a2a2a] transition-colors"
          onClick={onCopyAddr}
        >
          <span>
            {walletAddress?.substring(0, 3)}...{walletAddress?.substring(4, 7)}
          </span>
          <Copy width={14} height={16} color={colors.textsecondary} />
        </button>
      </div>

      {/* Balance Section */}
      <div className="bg-[#212121] rounded-2xl p-6 mb-8 text-center">
        <p className="text-[#f6f7f9] text-2xl font-bold mb-1">
          {formatUsd(Number(btcbalUsd))}
        </p>
        <p className="text-gray-400 mb-4">{formatNumber(Number(btcbal))} BTC</p>
        <CreateNewKey />
      </div>

      {/* Actions Section */}
      <div className="bg-[#212121] rounded-2xl p-6">
        <p className="text-gray-400 text-center mb-6">
          You can Send BTC directly to an address or create a link that allows
          other users to collect BTC from your wallet
        </p>

        <div className="h-px bg-[#2a2a2a] mb-6" />

        <div className="flex gap-3">
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
