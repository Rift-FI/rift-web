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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
    setProfileAnchorEl(null);
  };

  return (
    <section className="bg-[#0e0e0e] flex flex-col min-h-screen relative">
      <div
        className={`${
          isProfileModalOpen ? "blur-sm" : ""
        } transition-all duration-200`}
      >
        <div className="bg-[#0e0e0e] px-4 pt-4 py-2">
          <div className="flex justify-between items-center px-1 pt-4">
            <div className="bg-[#34404f] rounded-xl p-2 flex items-center gap-2">
              <img
                src={stratosphere}
                alt="sphere"
                className="w-4 h-4 rounded-full"
              />
              <p className="text-xs text-[#f6f7f9]">
                {ethAddr?.substring(2, 6)}
                {btcAddr?.substring(2, 6)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="notification"
                onClick={() => switchtab("notifications")}
              >
                <FaIcon
                  faIcon={faBell}
                  color={claimedstartairdrop ? "#00d09c4d" : "#b2b3b7"}
                  fontsize={16}
                />
              </button>
              <Avatar
                src={initData?.user?.photoUrl}
                alt={initData?.user?.username}
                sx={{
                  width: 32,
                  height: 32,
                }}
                onClick={(e) => {
                  setIsProfileModalOpen(true);
                  setProfileAnchorEl(e.currentTarget);
                }}
              />
            </div>
          </div>
        </div>

        <div className="px-4 pb-20 overflow-y-auto h-[calc(100vh-100px)]">
          <WalletBalance />
        </div>
      </div>

      {/* Profile Modal Overlay */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0" onClick={closeProfileModal} />
          <PopOverAlt
            anchorEl={profileAnchorEl}
            setAnchorEl={setProfileAnchorEl}
            onClose={closeProfileModal}
          >
            <div className="profile_actions">
              <div
                className="action first"
                onClick={() => {
                  onVisitProfile();
                  closeProfileModal();
                }}
              >
                <p>
                  Profile
                  <FaIcon
                    faIcon={faUser}
                    color={colors.textprimary}
                    fontsize={12}
                  />
                </p>
                <span>Personal profile</span>
              </div>
              <div
                className="action"
                onClick={() => {
                  onSwitchToBusiness();
                  closeProfileModal();
                }}
              >
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
        </div>
      )}
    </section>
  );
};
