import { JSX } from "react";
import { openTelegramLink } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import notification from "../../assets/images/icons/notification.png";
import aidrop from "../../assets/images/icons/campaing.png";
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

  useBackButton(goBack);

  return (
    <div className="px-2 mb-4">
      <div className="flex items-center gap-2">
        <img
          src={notification}
          alt="notification"
          className="w-8 h-8 rounded-full object-contain"
        />

        <p className="text-[#f6f7f9] flex flex-col font-semibold">
          Notifications{" "}
          <span className="text-gray-400 font-normal text-sm">
            Your notifications appear here
          </span>
        </p>
      </div>

      <div
        className="flex items-center gap-2 mt-4 my-1"
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
    </div>
  );
};
