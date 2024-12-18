import { JSX } from "react";
import { useTabs } from "../hooks/tabs";
import { Vault, Market, Labs, Security, Earn } from "../assets/icons";
import { colors } from "../constants";
import "../styles/components/tabs/bottomtab.css";

export const BottomTabNavigation = (): JSX.Element => {
  const { currTab, switchtab } = useTabs();

  return (
    <div id="bottomtab">
      <button onClick={() => switchtab("vault")}>
        <Vault
          color={currTab == "vault" ? colors.accent : colors.textprimary}
        />
        <span
          style={{
            color: currTab == "vault" ? colors.accent : colors.textprimary,
          }}
        >
          Vault
        </span>
      </button>

      <button onClick={() => switchtab("market")}>
        <Market
          color={currTab == "market" ? colors.accent : colors.textprimary}
        />
        <span
          style={{
            color: currTab == "market" ? colors.accent : colors.textprimary,
          }}
        >
          Market
        </span>
      </button>

      <button onClick={() => switchtab("labs")}>
        <Labs color={currTab == "labs" ? colors.accent : colors.textprimary} />
        <span
          style={{
            color: currTab == "labs" ? colors.accent : colors.textprimary,
          }}
        >
          Labs
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

      <button onClick={() => switchtab("earn")}>
        <Earn color={currTab == "earn" ? colors.accent : colors.textprimary} />
        <span
          style={{
            color: currTab == "earn" ? colors.accent : colors.textprimary,
          }}
        >
          Earn
        </span>
      </button>
    </div>
  );
};
