import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import {
  IconChartInfographic,
  IconHomeFilled,
  IconUserCircle,
} from "@tabler/icons-react";
import { backButton } from "@telegram-apps/sdk-react";
import HomeTab from "./HomeTab";
import ProfilePage from "./Profile";
import Data from "./Data";

function BusinessSuite() {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("Home");
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
      {currentTab === "Home" && <HomeTab />}
      {currentTab === "Data" && <Data />}
      {currentTab === "Profile" && <ProfilePage />}
      <div className="h-16 mb-12"></div>
      <div className="fixed shadow-lg z-50 bottom-0 left-0 right-0 w-full px-4 py-4 flex items-center justify-between bg-divider rounded-t-2xl backdrop-blur-lg">
        <IconHomeFilled size={26} onClick={() => setCurrentTab("Home")} />
        <IconChartInfographic size={26} onClick={() => setCurrentTab("Data")} />
        <IconUserCircle size={26} onClick={() => setCurrentTab("Profile")} />
      </div>
    </div>
  );
}

export default BusinessSuite;
