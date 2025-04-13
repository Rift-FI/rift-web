import { JSX, useEffect, useState } from "react";
import { backButton, useLaunchParams } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { Avatar } from "@mui/material";
import { faUser, faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { useTabs } from "../../hooks/tabs";
import { useAppDialog } from "../../hooks/dialog";
import { PopOverAlt } from "../../components/global/PopOver";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import airdrop from "../../assets/images/icons/campaing.png";

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
    openAppDialog("loading", "Switching to Personal Account");

    setTimeout(() => {
      closeAppDialog();
      switchtab("home");
      navigate("/app");
    }, 1500);
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
    <section className="min-h-screen bg-[#0e0e0e] px-4 py-6">
      {/* Profile Section */}
      <div className="flex justify-end mb-8">
        <div className="relative">
          <Avatar
            src={initData?.user?.photoUrl}
            alt={initData?.user?.username}
            sx={{
              width: 36,
              height: 36,
              cursor: "pointer",
              transition: "transform 0.2s",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
            onClick={(e) => {
              setProfileAnchorEl(e.currentTarget);
            }}
          />
          <PopOverAlt
            anchorEl={profileAnchorEl}
            setAnchorEl={setProfileAnchorEl}
          >
            <div className="w-64 bg-[#212121] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-[#2a2a2a]">
                <p className="text-[#f6f7f9] font-medium">Personal Account</p>
                <p className="text-gray-400 text-sm mt-1">
                  Sphere Personal Account
                </p>
              </div>
              <div
                className="p-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                onClick={switchToPersonalProfile}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[#f6f7f9] font-medium">Personal Account</p>
                  <FaIcon
                    faIcon={faUser}
                    color={colors.textprimary}
                    fontsize={12}
                  />
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  Switch to Personal Account
                </p>
              </div>
            </div>
          </PopOverAlt>
        </div>
      </div>

      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-[#f6f7f9] text-2xl font-bold mb-2">
          For Businesses
        </h1>
        <p className="text-gray-400">
          Streamline airdrops & tokens distribution
        </p>
      </div>

      {/* Airdrop Campaign Card */}
      <div
        className="bg-[#212121] rounded-2xl p-6 shadow-lg cursor-pointer hover:bg-[#2a2a2a] transition-colors group"
        onClick={onstartCampaign}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#ffb386]/10 flex items-center justify-center">
              <img src={airdrop} alt="airdrop" className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-[#f6f7f9] text-lg font-semibold">
                Airdrop Campaigns
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Setup an Airdrop Campaign
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#ffb386]/10 flex items-center justify-center group-hover:bg-[#ffb386]/20 transition-colors">
            <FaIcon
              faIcon={faCirclePlus}
              color={colors.textprimary}
              fontsize={22}
            />
          </div>
        </div>
      </div>

      {/* Additional Features Section */}
      <div className="mt-8">
        <h2 className="text-[#f6f7f9] text-lg font-semibold mb-4">
          Business Features
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <FeatureCard
            title="Token Distribution"
            description="Efficiently distribute tokens to multiple recipients"
            icon={
              <FaIcon
                faIcon={faCirclePlus}
                color={colors.textprimary}
                fontsize={16}
              />
            }
          />
          <FeatureCard
            title="Campaign Analytics"
            description="Track and analyze your airdrop campaigns"
            icon={
              <FaIcon
                faIcon={faCirclePlus}
                color={colors.textprimary}
                fontsize={16}
              />
            }
          />
        </div>
      </div>
    </section>
  );
}

const FeatureCard = ({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: JSX.Element;
}) => (
  <div className="bg-[#212121] rounded-xl p-4 hover:bg-[#2a2a2a] transition-colors cursor-pointer">
    <div className="w-10 h-10 rounded-full bg-[#ffb386]/10 flex items-center justify-center mb-3">
      {icon}
    </div>
    <h3 className="text-[#f6f7f9] font-medium">{title}</h3>
    <p className="text-gray-400 text-sm mt-1">{description}</p>
  </div>
);
