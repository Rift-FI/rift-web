import { useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import {
  IconChartInfographic,
  IconHomeFilled,
  IconPlus,
  IconUserCircle,
} from "@tabler/icons-react";
import { Airdropped } from "../../components/charts/Airdropped";
import { backButton } from "@telegram-apps/sdk-react";
import { UnlockedChart } from "../../components/charts/Unlocked";
import { PointsChart } from "../../components/charts/Points";

function BusinessSuite() {
  const navigate = useNavigate();
  const backbuttonclick = () => {
    navigate(-1);
  };
  toast.success("Switched to Sphere Business");
  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(backbuttonclick);
    }

    return () => {
      backButton.unmount();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="h-screen bg-primary font-body">
      <h1 className="text-textprimary text-xl font-bold text-center mt-1">
        Business One Click Suite
      </h1>
      <p className="text-sm text-textsecondary text-center leading-relaxed pb-2 border-b-[1px] border-gray-500">
        Streamline Airdrops and Token Distributions with One Click
      </p>
      <div className="px-2">
        <div className="w-full bg-divider rounded-xl mt-2 h-auto">
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
              {/* <p className="text-gray-600 text-xs font-semibold leading-relaxed">
                Create
              </p> */}
            </div>
          </div>
          <Airdropped />
        </div>
        <div className="flex flex-col items-center gap-2 mt-2">
          <div className="bg-divider/10 w-full rounded-xl mx-1">
            <div className="flex items-center justify-between">
              <div className="px-4 py-4">
                <h1 className="text-textprimary text-xl font-body font-bold">
                  $4,175
                </h1>
                <p className=" text-gray-400 text-xs font-semibold leading-relaxed">
                  USDT Unlocked
                </p>
              </div>
              <div className="flex flex-col items-center justify-center pr-2">
                <IconPlus size={30} className="cursor-pointer" />
                {/* <p className="text-gray-600 text-xs font-semibold leading-relaxed">
                Create
              </p> */}
              </div>
            </div>
            <UnlockedChart />
          </div>
          <div className="bg-divider w-full rounded-xl mx-1">
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
                {/* <p className="text-gray-600 text-xs font-semibold leading-relaxed">
                Create
              </p> */}
              </div>
            </div>
            <PointsChart />
          </div>
        </div>
      </div>
      <div className="h-16"></div>
      <div className="fixed z-50 bottom-0 left-0 right-0 w-full px-4 py-4 flex items-center justify-between bg-primary">
        <IconHomeFilled size={26} />
        <IconChartInfographic size={26} />
        <IconUserCircle size={26} />
      </div>
    </div>
  );
}

export default BusinessSuite;
