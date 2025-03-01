import { JSX, ReactNode } from "react";
import { useTabs, tabsType } from "../hooks/tabs";
import { Labs, Security, Home, Market } from "../assets/icons/tabs";
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
        <Home
          width={20}
          height={20}
          color={currTab == "home" ? colors.accent : colors.textprimary}
        />
      ),
    },
    {
      menu: "security",
      title: "Security",
      icon: (
        <Security
          color={currTab == "security" ? colors.accent : colors.textprimary}
        />
      ),
    },
    {
      menu: "rewards",
      title: "Rewards",
      icon: (
        <Labs
          width={20}
          height={20}
          color={currTab == "rewards" ? colors.accent : colors.textprimary}
        />
      ),
    },
    {
      menu: "earn",
      title: "Markets",
      icon: (
        <Market
          color={currTab == "earn" ? colors.accent : colors.textprimary}
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
