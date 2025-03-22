import { useEffect, useState, JSX } from "react";
import { useNavigate } from "react-router";
import { backButton, useLaunchParams } from "@telegram-apps/sdk-react";
import { Avatar } from "@mui/material";
import {
  faBell,
  faCubesStacked,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useTabs } from "../../hooks/tabs";
import { useAppDialog } from "../../hooks/dialog";
import { WalletBalance } from "../WalletBalance";
import { PopOverAlt } from "../global/PopOver";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
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

  const onSwitchToBusiness = () => {
    setProfileAnchorEl(null);

    openAppDialog("loading", "Switching to Sphere for Business");

    setTimeout(() => {
      closeAppDialog();
      navigate("/business");
    }, 1500);
  };

  const onVisitProfile = () => {
    switchtab("profile");
  };

  const ethAddr = localStorage.getItem("ethaddress");
  const btcAddr = localStorage.getItem("btcaddress");
  const claimedstartairdrop = localStorage.getItem("claimedstartairdrop");

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
            <FaIcon
              faIcon={faBell}
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
        <div className="profile_actions">
          <div className="action first" onClick={onVisitProfile}>
            <p>
              Profile
              <FaIcon
                faIcon={faUser}
                color={colors.textprimary}
                fontsize={12}
              />
            </p>
            <span>Visit My Profile</span>
          </div>
          <div className="action" onClick={onSwitchToBusiness}>
            <p>
              Business
              <FaIcon
                faIcon={faCubesStacked}
                color={colors.textprimary}
                fontsize={12}
              />
            </p>
            <span>Switch to Sphere for Businesses</span>
          </div>
        </div>
      </PopOverAlt>

      <WalletBalance />
    </section>
  );
};
