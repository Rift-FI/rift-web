import { JSX, useEffect } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { useTabs } from "../../hooks/tabs";
import { useAppDialog } from "../../hooks/dialog";
import notification from "../../assets/images/icons/notification.png";
import aidrop from "../../assets/images/icons/campaing.png";
import "../../styles/components/tabs/notifications.scss";

export const Notifications = (): JSX.Element => {
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { openAppDialog } = useAppDialog();

  let claimedstartairdrop = localStorage.getItem("claimedstartairdrop");

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  const claimAirdrop = () => {
    if (claimedstartairdrop == null) {
      //https://strato-vault.com/airdrop?id=WlSWIXTUN9UD
      localStorage.setItem("claimedstartairdrop", "true");
      navigate("/rewards/WlSWIXTUN9UD");
    } else {
      openAppDialog(
        "failure",
        "Sorry, you have already claimed your Airdrop rewards (:"
      );
    }
  };

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(goBack);
    }

    return () => {
      backButton.offClick(goBack);
      backButton.unmount();
    };
  }, []);

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
            StratoSphere, claim your rewards now.
          </span>
        </p>
      </div>
    </div>
  );
};
