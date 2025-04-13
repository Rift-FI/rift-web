import { JSX } from "react";
import { useNavigate, useParams } from "react-router";
import { faCircleArrowUp } from "@fortawesome/free-solid-svg-icons";
import { useBackButton } from "../../hooks/backbutton";
import { useSnackbar } from "../../hooks/snackbar";
import { useTabs } from "../../hooks/tabs";
import { formatUsd, formatNumber } from "../../utils/formatters";
import { SubmitButton } from "../../components/global/Buttons";

import { Copy, Telegram } from "../../assets/icons/actions";
import { FaIcon } from "../../assets/faicon";

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

  const walletAddress = localStorage.getItem("ethaddress");
  const ethbal = localStorage.getItem("ethbal");
  const ethbalUsd = localStorage.getItem("ethbalUsd");

  const onCopyAddr = () => {
    if (walletAddress !== null) {
      navigator.clipboard.writeText(walletAddress as string);
      showsuccesssnack("Address copied to clipboard");
    }
  };

  const onSendEth = () => {
    localStorage.setItem("prev_page", `/eth-asset/${intent}`);
    navigate(`/send-crypto/ETH/${intent}`);
  };

  const onSendEthLink = () => {
    localStorage.setItem("prev_page", `/eth-asset/${intent}`);
    navigate(`/sendcollectlink/ETH/${intent}`);
  };

  useBackButton(goBack);

  return (
    <section className="flex flex-col items-center p-4 bg-[#0e0e0e] text-[#f6f7f9] h-full">
      <div className="flex justify-center">
        <img src={ethlogo} alt="eth" className="w-16 h-16 rounded-full mb-4" />
      </div>

      <button
        className="address flex items-center gap-2 bg-[#34404f] text-[#f6f7f9] px-3 py-1 rounded-full text-sm mb-4 hover:opacity-80 transition-opacity"
        onClick={onCopyAddr}
      >
        <span>
          {walletAddress?.substring(0, 5)}...
          {walletAddress?.substring(walletAddress.length - 4)}
        </span>
        <Copy width={14} height={14} color="#f6f7f9" />
      </button>

      <div className="balance flex flex-col items-center mb-6">
        <p className="text-3xl font-bold text-[#f6f7f9]">
          {formatUsd(Number(ethbalUsd))}
        </p>
        <span className="text-sm text-gray-400">
          {formatNumber(Number(ethbal))} ETH
        </span>
      </div>

      <div className="actions w-full max-w-md flex flex-col items-center gap-4 bg-[#2a2e2c] p-4 rounded-xl border border-[#34404f]">
        <p className="text-center text-sm text-gray-400">
          You can Send Eth directly to an address or create a link that allows
          other users to collect ETH from your wallet
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
            onclick={onSendEthLink}
          />
          <SubmitButton
            text="Send ETH"
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
            onclick={onSendEth}
          />
        </div>
      </div>
    </section>
  );
}
