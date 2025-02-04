import { useEffect, useState } from "react";
import {
  IconGiftFilled,
  IconHomeFilled,
  IconUserCircle,
} from "@tabler/icons-react";
import { backButton } from "@telegram-apps/sdk-react";
import HomeTab from "./HomeTab";
import ProfilePage from "./Profile";
import Gift from "./Gift";

function BusinessSuite() {
  const [currentTab, setCurrentTab] = useState("Home");

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
    <div className="h-screen bg-primary font-body">
      {currentTab === "Home" && <HomeTab />}
      {currentTab === "Data" && <Gift />}
      {currentTab === "Profile" && <ProfilePage />}
      <div className="h-16 mb-12"></div>
      <div className="fixed shadow-lg z-50 bottom-0 left-0 right-0 w-full px-4 py-4 flex items-center justify-between bg-divider rounded-t-2xl backdrop-blur-lg">
        <IconHomeFilled size={26} onClick={() => setCurrentTab("Home")} />
        <IconGiftFilled size={26} onClick={() => setCurrentTab("Gift")} />
        <IconUserCircle size={26} onClick={() => setCurrentTab("Profile")} />
      </div>
    </div>
  );
}

export default BusinessSuite;
