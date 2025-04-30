import { JSX } from "react";
import { openTelegramLink } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { getTransactionHistory } from "@/utils/api/wallet";
import { openLink } from "@telegram-apps/sdk-react";
import notification from "../../assets/images/icons/notification.png";
import aidrop from "../../assets/images/icons/campaing.png";
import ethlogo from "../../assets/images/eth.png";
import usdclogo from "../../assets/images/labs/usdc.png";
import wberalogo from "../../assets/images/icons/bera.webp";
import { Stake } from "@/assets/icons/actions";
import { colors } from "@/constants";
import "../../styles/components/tabs/notifications.scss";

export const Notifications = (): JSX.Element => {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const claimedstartairdrop = localStorage.getItem("claimedstartairdrop");

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  const claimAirdrop = () => {
    localStorage.setItem("claimedstartairdrop", "true");
    openTelegramLink("https://t.me/strato_vault_bot?start=start");
  };

  const { data: transactionshistory } = useQuery({
    queryKey: ["txhistory"],
    queryFn: getTransactionHistory,
  });

  const polygonscan = "https://polygonscan.com/tx/"; //-> USDT
  const berascan = "https://berascan.com/search?q="; //-> WBERA, WUSDC
  const etherscan = "https://etherscan.io/search?f=0&q="; //-> ETH

  useBackButton(goBack);

  return (
    <div className="notifications">
      <div className="flex items-center gap-2">
        <img
          src={notification}
          alt="notification"
          className="w-8 h-8 rounded-full object-contain"
        />

        <p className="text-[#f6f7f9] flex flex-col font-semibold">
          Notifications
          <span className="text-gray-400 font-normal text-sm">
            Your notifications appear here
          </span>
        </p>
      </div>

      <div
        className="flex items-center gap-2 my-4"
        style={{
          backgroundColor: claimedstartairdrop == null ? "" : "transparent",
        }}
        onClick={claimAirdrop}
      >
        <img
          src={aidrop}
          alt="airdrop"
          className="w-6 h-6 rounded-full object-contain"
        />

        <p className="text-sm text-[#f6f7f9] flex flex-col gap-1 font-semibold">
          Airdrop Alert
          <span className="text-gray-400 font-normal text-xs">
            You have been invited to participate in an Airdrop for joining
            Sphere, claim your rewards now.
          </span>
        </p>
      </div>

      {transactionshistory?.transactions?.map((_tx) => (
        <div
          className="notification"
          onClick={() => {
            _tx?.currency == "USDC"
              ? openLink(polygonscan + _tx?.transactionHash)
              : _tx?.currency == "ETH"
              ? openLink(etherscan + _tx?.transactionHash)
              : openLink(berascan + _tx?.transactionHash);
          }}
        >
          <img
            src={
              _tx?.currency == "ETH"
                ? ethlogo
                : _tx?.currency == "WBERA"
                ? wberalogo
                : usdclogo
            }
            alt={_tx?.currency}
          />

          <div className="currency_link">
            <p className="currency">
              {_tx?.amount}{" "}
              {_tx?.currency === "WUSDC" ? "USDC.e" : _tx?.currency}
            </p>
            <p className="link">
              {_tx?.createdAt}
              <span>
                {_tx?.transactionHash?.substring(0, 8) + "..."}
                <Stake width={6} height={11} color={colors.accent} />
              </span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
