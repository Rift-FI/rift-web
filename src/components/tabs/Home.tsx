import { useEffect, useState, JSX } from "react";
import { useNavigate } from "react-router";
import { backButton, useLaunchParams } from "@telegram-apps/sdk-react";
import { Avatar } from "@mui/material";
import { useTabs } from "../../hooks/tabs";
import { useAppDialog } from "../../hooks/dialog";
import { WalletBalance } from "../WalletBalance";
import { PopOverAlt } from "../global/PopOver";
import { QuickActions, Stake } from "../../assets/icons/actions";
import { colors } from "../../constants";
import { Notification } from "../../assets/icons/tabs";
import stratosphere from "../../assets/images/sphere.jpg";
import "../../styles/components/tabs/home.scss";

export const HomeTab = (): JSX.Element => {
  const { initData } = useLaunchParams();
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { openAppDialog, closeAppDialog } = useAppDialog();

  const [profileAnchorEl, setProfileAnchorEl] = useState<HTMLDivElement | null>(
    null
  );

  const ongoToProfile = () => {
    setProfileAnchorEl(null);
    switchtab("profile");
  };

  const onSwitchToBusiness = () => {
    setProfileAnchorEl(null);

    openAppDialog("loading", "Switching to Stratosphere Business");

    setTimeout(() => {
      closeAppDialog();
      navigate("/business");
    }, 1500);
  };

  let ethAddr = localStorage.getItem("address");
  let btcAddr = localStorage.getItem("btcaddress");
  let claimedstartairdrop = localStorage.getItem("claimedstartairdrop");

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
    }

    if (backButton.isVisible()) {
      backButton.hide();
    }

    return () => {
      backButton.unmount();
    };
  }, []);

  return (
    <section id="hometab">
      <div className="id_actions">
        <div className="sphereid">
          <img src={stratosphere} alt="sphere" />
          <p>
            {ethAddr?.substring(2, 6)}
            {btcAddr?.substring(2, 6)}
          </p>
        </div>

        <div className="avatrctr">
          <button
            className="notification"
            onClick={() => switchtab("notifications")}
          >
            <Notification
              width={18}
              height={18}
              color={claimedstartairdrop ? colors.textsecondary : colors.danger}
            />
          </button>

          <Avatar
            src={initData?.user?.photoUrl}
            alt={initData?.user?.username}
            sx={{
              width: 36,
              height: 36,
            }}
            onClick={(e) => {
              setProfileAnchorEl(e.currentTarget);
            }}
          />
        </div>
      </div>
      <PopOverAlt anchorEl={profileAnchorEl} setAnchorEl={setProfileAnchorEl}>
        {
          <div className="profile_actions">
            <div className="action first" onClick={ongoToProfile}>
              <p>
                My Profile <Stake color={colors.textprimary} />
              </p>
              <span>Visit my profile</span>
            </div>
            <div className="action" onClick={onSwitchToBusiness}>
              <p>
                Business
                <QuickActions
                  width={10}
                  height={10}
                  color={colors.textprimary}
                />
              </p>
              <span>Stratosphere for Businesses</span>
            </div>
          </div>
        }
      </PopOverAlt>

      <WalletBalance />
    </section>
  );
};
