import { JSX, useEffect, useState } from "react";
import { backButton, useLaunchParams } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { Avatar } from "@mui/material";
import { useTabs } from "../../hooks/tabs";
import { useAppDialog } from "../../hooks/dialog";
import { PopOverAlt } from "../../components/global/PopOver";
import { Add, QuickActions, Stake } from "../../assets/icons/actions";
import { colors } from "../../constants";
import airdrop from "../../assets/images/icons/campaing.png";
import "../../styles/pages/business/home.scss";

export default function Business(): JSX.Element {
  const { initData } = useLaunchParams();
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { openAppDialog, closeAppDialog } = useAppDialog();

  const [profileAnchorEl, setProfileAnchorEl] = useState<HTMLDivElement | null>(
    null
  );

  const switchToPersonalProfile = () => {
    setProfileAnchorEl(null);
    openAppDialog("loading", "Switching to personal Account");

    setTimeout(() => {
      closeAppDialog();
      switchtab("home");
      navigate("/app");
    }, 1500);
  };

  const goToBusinessProfile = () => {
    setProfileAnchorEl(null);
  };

  const onstartCampaign = () => {
    navigate("/start-campaign");
  };

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
    <section id="businesshome">
      <div className="avatrctr">
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
        <PopOverAlt anchorEl={profileAnchorEl} setAnchorEl={setProfileAnchorEl}>
          {
            <div className="profile_actions">
              <div className="action first" onClick={switchToPersonalProfile}>
                <p>
                  Personal Account <Stake color={colors.textprimary} />
                </p>
                <span>Stratosphere personal account</span>
              </div>
              <div className="action" onClick={goToBusinessProfile}>
                <p>
                  Business
                  <QuickActions
                    width={10}
                    height={10}
                    color={colors.textprimary}
                  />
                </p>
                <span>Stratosphere for Businesses *</span>
              </div>
            </div>
          }
        </PopOverAlt>
      </div>

      <p className="title">For Businesses</p>
      <p className="desc">Streamline airdrops & tokens distribution</p>

      <div className="startairdrop" onClick={onstartCampaign}>
        <div className="img_desc">
          <img src={airdrop} alt="airdrop" />
          <p>
            Airdrop Campanigns
            <span>Setup an Airdrop Campaign</span>
          </p>
        </div>

        <button>
          <Add width={20} height={20} color={colors.textprimary} />
        </button>
      </div>
    </section>
  );
}
