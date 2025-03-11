import { JSX, ReactNode } from "react";
import { useTabs, tabsType } from "../hooks/tabs";
import {
  faHouse,
  faDiceFive,
  faFlask,
  faGift,
  faShield,
} from "@fortawesome/free-solid-svg-icons";
import { FaIcon } from "../assets/faicon";
import { colors } from "../constants";
import "../styles/components/tabs/bottomtab.scss";

type tabMenus = {
  menu: tabsType;
  title: string;
  icon: ReactNode;
};

export const BottomTabNavigation = (): JSX.Element => {
  const { currTab, switchtab } = useTabs();

  const bottomtabMenus: tabMenus[] = [
    {
      menu: "home",
      title: "Home",
      icon: (
        <FaIcon
          faIcon={faHouse}
          color={currTab == "home" ? colors.accent : colors.textprimary}
        />
      ),
    },
    {
      menu: "earn",
      title: "DeFi",
      icon: (
        <div className="fa-icon-container">
          <FaIcon
            faIcon={faDiceFive}
            color={currTab == "earn" ? colors.accent : colors.textprimary}
          />
        </div>
      ),
    },
    {
      menu: "labs",
      title: "Labs",
      icon: (
        <div className="fa-icon-container">
          <FaIcon
            faIcon={faFlask}
            color={currTab == "labs" ? colors.accent : colors.textprimary}
          />
        </div>
      ),
    },
    {
      menu: "rewards",
      title: "Rewards",
      icon: (
        <FaIcon
          faIcon={faGift}
          color={currTab == "rewards" ? colors.accent : colors.textprimary}
        />
      ),
    },
    {
      menu: "security",
      title: "Keys",
      icon: (
        <FaIcon
          faIcon={faShield}
          color={currTab == "security" ? colors.accent : colors.textprimary}
        />
      ),
    },
  ];

  return (
    <div id="bottomtab">
      {bottomtabMenus?.map((bottomtab, index) => (
        <button
          key={index + bottomtab?.title}
          onClick={() => switchtab(bottomtab.menu)}
          className={currTab === bottomtab.menu ? "active" : ""}
        >
          {bottomtab?.icon}
          <span
            style={{
              color:
                currTab == bottomtab?.menu ? colors.accent : colors.textprimary,
            }}
          >
            {bottomtab?.title}
          </span>
        </button>
      ))}
    </div>
  );
};

export const BottomButtonContainer = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "0.5rem 0.875rem",
        backgroundColor: colors.primary,
        zIndex: 1000,
      }}
    >
      {children}
    </div>
  );
};
