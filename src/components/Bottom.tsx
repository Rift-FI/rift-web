import { JSX } from "react";
import { Avatar } from "@mui/material";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useTabs } from "../hooks/tabs";
import { useAppDrawer } from "../hooks/drawer";
import { Labs, Security, QuickActions, Home } from "../assets/icons";
import { colors } from "../constants";
import "../styles/components/tabs/bottomtab.css";

export const BottomTabNavigation = (): JSX.Element => {
  const { initData } = useLaunchParams();
  const { currTab, switchtab } = useTabs();
  const { openAppDrawer } = useAppDrawer();

  return (
    <div id="bottomtab">
      <button onClick={() => switchtab("home")}>
        <Home
          width={20}
          height={20}
          color={currTab == "home" ? colors.accent : colors.textprimary}
        />
        <span
          style={{
            color: currTab == "home" ? colors.accent : colors.textprimary,
          }}
        >
          Home
        </span>
      </button>

      <button onClick={() => switchtab("labs")}>
        <Labs
          width={20}
          height={20}
          color={currTab == "labs" ? colors.accent : colors.textprimary}
        />
        <span
          style={{
            color: currTab == "labs" ? colors.accent : colors.textprimary,
          }}
        >
          Labs
        </span>
      </button>

      <button
        className="quickactions"
        onClick={() => openAppDrawer("quickactions")}
      >
        <QuickActions color={colors.primary} />
      </button>

      <button onClick={() => switchtab("security")}>
        <Security
          color={currTab == "security" ? colors.accent : colors.textprimary}
        />
        <span
          style={{
            color: currTab == "security" ? colors.accent : colors.textprimary,
          }}
        >
          Security
        </span>
      </button>

      <div
        style={{
          border:
            currTab == "profile" ? `1px solid ${colors.textsecondary}` : 0,
        }}
        className="avatrctr"
      >
        <Avatar
          src={initData?.user?.photoUrl}
          alt={initData?.user?.username}
          sx={{
            width: 32,
            height: 32,
          }}
          onClick={() => {
            switchtab("profile");
            console.log("goingtoprofile");
          }}
        />
      </div>
    </div>
  );
};
