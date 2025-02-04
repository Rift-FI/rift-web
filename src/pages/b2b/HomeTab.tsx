import { JSX, useState } from "react";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { Avatar } from "@mui/material";
import { useTabs } from "../../hooks/tabs";
import { useAppDialog } from "../../hooks/dialog";
import { PopOverAlt } from "../../components/global/PopOver";
import { Airdropped } from "../../components/charts/Airdropped";
import { UnlockedChart } from "../../components/charts/Unlocked";
import { PointsChart } from "../../components/charts/Points";
import { TxnTable } from "./TxnTable";
import { PaginationContainer } from "./Pagination";
import { IconPlus } from "@tabler/icons-react";
import { Add, QuickActions, Stake } from "../../assets/icons";
import { colors } from "../../constants";
import airdrop from "../../assets/images/icons/campaing.png";
import "../../styles/pages/business/home.scss";

export default function HomeTab(): JSX.Element {
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

  return (
    <section id="businesshome">
      <div className="avatrctr">
        <Avatar
          src={initData?.user?.photoUrl}
          alt={initData?.user?.username}
          sx={{
            width: 32,
            height: 32,
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

      <div>
        <div className="w-full rounded-xl mt-2 h-auto">
          <div className="flex items-center justify-between">
            <div className="px-4 py-4">
              <h1 className="text-textprimary text-4xl font-body font-bold">
                $1,000
              </h1>
              <p className="text-gray-500 text-xs font-semibold leading-relaxed">
                Airdropped this month
              </p>
            </div>

            <div className="flex flex-col items-center justify-center pr-2">
              <IconPlus size={30} className="cursor-pointer" />
            </div>
          </div>

          <Airdropped />
        </div>

        <div className="flex flex-col items-center gap-2 mt-2">
          <div className="w-full rounded-xl mx-1">
            <div className="flex items-center justify-between">
              <div className="px-4 py-4">
                <h1 className="text-textprimary text-xl font-body font-bold">
                  $4,175
                </h1>
                <p className=" text-gray-400 text-xs font-semibold leading-relaxed">
                  USDC Unlocked
                </p>
              </div>
              <div className="flex flex-col items-center justify-center pr-2">
                <IconPlus size={30} className="cursor-pointer" />
              </div>
            </div>
            <UnlockedChart />
          </div>
          <div className="w-full rounded-xl mx-1">
            <div className="flex items-center justify-between">
              <div className="px-4 py-4">
                <h1 className="text-textprimary text-xl font-body font-bold">
                  10,000
                </h1>
                <p className=" text-gray-400 text-xs font-semibold leading-relaxed">
                  Distrubuted Points
                </p>
              </div>
              <div className="flex flex-col items-center justify-center pr-2">
                <IconPlus size={30} className="cursor-pointer" />
              </div>
            </div>
            <PointsChart />
          </div>
        </div>
      </div>

      <h1 className="font-body px-2 font-semibold text-xl mt-4 mb-2 ">
        Transaction History
      </h1>
      <TxnTable />
      <PaginationContainer />
    </section>
  );
}
