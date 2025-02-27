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

  let claimedstartairdrop = localStorage.getItem("claimedstartairdrop");

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
    <div className="notifications">
      <div className="notif_desc">
        <img src={notification} alt="notification" />

        <p>
          Notifications <span>Your notifications appear here</span>
        </p>
      </div>

      <div
        className="notif_body"
        style={{
          backgroundColor: claimedstartairdrop == null ? "" : "transparent",
        }}
        onClick={claimAirdrop}
      >
        <img src={aidrop} alt="airdrop" />

        <p>
          Airdrop Alert
          <span>
            You have been invited to participate in an Airdrop for joining
            Sphere, claim your rewards now.
          </span>
        </p>
      </div>
    </div>
  );
};
