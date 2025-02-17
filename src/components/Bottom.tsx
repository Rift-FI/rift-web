import { JSX } from "react";
import { useNavigate } from "react-router";
import { useTabs } from "../hooks/tabs";
import { Labs, Security, Home, Market } from "../assets/icons/tabs";
import { colors } from "../constants";
import "../styles/components/tabs/bottomtab.scss";

export const BottomTabNavigation = (): JSX.Element => {
  const navigate = useNavigate();
  const { currTab, switchtab } = useTabs();

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

      <button onClick={() => navigate("/rewards/nil")}>
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
          Missions
        </span>
      </button>

      <button onClick={() => switchtab("earn")}>
        <Market
          color={currTab == "earn" ? colors.accent : colors.textprimary}
        />
        <span
          style={{
            color: currTab == "earn" ? colors.accent : colors.textprimary,
          }}
        >
          Markets
        </span>
      </button>
    </div>
  );
};
