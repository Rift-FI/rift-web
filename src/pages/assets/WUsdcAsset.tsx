import { JSX } from "react";
import { useNavigate, useParams } from "react-router";
import { faCircleArrowUp } from "@fortawesome/free-solid-svg-icons";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { useTabs } from "../../hooks/tabs";
import { formatUsd, formatNumber } from "../../utils/formatters";
import { SubmitButton } from "../../components/global/Buttons";
// import { CreateNewKey } from "./BtcAsset";
import { Copy, Telegram } from "../../assets/icons/actions";
import { FaIcon } from "../../assets/faicon";
import usdclogo from "../../assets/images/labs/usdc.png";

export default function WUsdcAsset(): JSX.Element {
  const navigate = useNavigate();
  const { intent } = useParams();
  const { showsuccesssnack } = useSnackbar();
  const { switchtab } = useTabs();

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  const walletAddress = localStorage.getItem("ethaddress");
  const wusdcbal = localStorage.getItem("wusdcbal");

  const onCopyAddr = () => {
    if (walletAddress !== null) {
      navigator.clipboard.writeText(walletAddress as string);
      showsuccesssnack("Address copied to clipboard");
    }
  };

  const onSendUSDC = () => {
    localStorage.setItem("prev_page", `/usdc-asset/${intent}`);
    navigate(`/send-crypto/WUSDC/${intent}`);
  };

  const onSendUSDCLink = () => {
    localStorage.setItem("prev_page", `/usdc-asset/${intent}`);
    navigate(`/sendcollectlink/WUSDC/${intent}`);
  };

  useBackButton(goBack);

  return (
    <section className="flex flex-col items-center p-4 bg-[#212523] text-[#f6f7f9] h-full">
      <img src={usdclogo} alt="usdc" className="w-16 h-16 rounded-full mb-4" />

      <button
        className="address flex items-center gap-2 bg-[#34404f] text-[#f6f7f9] px-3 py-1 rounded-full text-sm mb-4"
        onClick={onCopyAddr}
      >
        {walletAddress?.substring(0, 3)}...
        {walletAddress?.substring(walletAddress.length - 4)}
        <Copy width={14} height={16} color="#f6f7f9" />
      </button>

      <div className="balance flex flex-col items-center mb-6">
        <p className="text-3xl font-bold">{formatUsd(Number(wusdcbal))}</p>
        <span className="text-sm text-gray-400">
          {formatNumber(Number(wusdcbal))} USDC
        </span>
        {/** Ability to create new keys will be added in the future */}
        {/* <CreateNewKey /> */}
      </div>

      <div className="actions w-full max-w-md flex flex-col items-center gap-4 bg-[#2a2e2c] p-4 rounded-xl border border-[#34404f]">
        <p className="text-center text-sm text-gray-400">
          You can Send BERACHAIN USDC directly to an address or create a payment
          link for others to collect usdc from your wallet.
        </p>

        <span className="divider w-full h-[1px] bg-[#34404f]" />

        <div className="buttons flex justify-between w-full gap-3">
          <SubmitButton
            text="Create Link"
            icon={<Telegram width={18} height={18} color="#f6f7f9" />}
            sxstyles={{
              flexGrow: 1,
              padding: "0.75rem",
              borderRadius: "2rem",
              backgroundColor: "#34404f",
              color: "#f6f7f9",
              fontSize: "0.875rem",
              fontWeight: "normal",
            }}
            onclick={onSendUSDCLink}
          />
          <SubmitButton
            text="Send USDC"
            icon={<FaIcon faIcon={faCircleArrowUp} color="#212523" />}
            sxstyles={{
              flexGrow: 1.5,
              padding: "0.75rem",
              borderRadius: "2rem",
              backgroundColor: "#ffb386",
              color: "#212523",
              fontSize: "0.875rem",
              fontWeight: "bold",
            }}
            onclick={onSendUSDC}
          />
        </div>
      </div>
    </section>
  );
}
