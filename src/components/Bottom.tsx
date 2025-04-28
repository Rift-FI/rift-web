import { CSSProperties, JSX, ReactNode } from "react";
import { useTabs, tabsType } from "../hooks/tabs";
import { faHouse, faDiceFive, faGift } from "@fortawesome/free-solid-svg-icons";
import { FaIcon } from "../assets/faicon";
import { colors } from "../constants";
import { Polymarket } from "../assets/icons/actions";
import "../styles/components/tabs/bottomtab.scss";

type tabMenus = {
  menu: tabsType;
  title: string;
  icon: ReactNode;
};

export const BottomTabNavigation = (): JSX.Element => {
  const { currTab, switchtab } = useTabs();
  // const navigate = useNavigate();

  const bottomtabMenus: tabMenus[] = [
    {
      menu: "home",
      title: "Home",
      icon: (
        <FaIcon
          faIcon={faHouse}
          color={currTab == "home" ? "#ffb386" : colors.textprimary}
          fontsize={20}
        />
      ),
    },
    {
      menu: "lend",
      title: "Lend Assets",
      icon: (
        <div className="fa-icon-container">
          <FaIcon
            faIcon={faDiceFive}
            color={currTab == "lend" ? "#ffb386" : colors.textprimary}
            fontsize={20}
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
          color={currTab == "rewards" ? "#ffb386" : colors.textprimary}
          fontsize={20}
        />
      ),
    },
    {
      menu: "polymarket",
      title: "Polymarktet",
      icon: (
        <Polymarket
          color={currTab == "polymarket" ? "#ffb386" : colors.textprimary}
        />
      ),
    },
  ];

  return (
    <div className="bg-[#212121]/80 backdrop-blur-xl flex justify-between items-center fixed bottom-0 w-full z-10 py-2 px-4 border-t border-white/10">
      {bottomtabMenus?.map((bottomtab, index) => (
        <button
          key={index + bottomtab?.title}
          onClick={() => switchtab(bottomtab.menu)}
          className={`bottom-nav-button ${
            currTab === bottomtab.menu ? "active" : ""
          }`}
        >
          <div className="icon-wrapper">{bottomtab?.icon}</div>
          <span className="button-text">{bottomtab?.title}</span>
        </button>
      ))}
    </div>
  );
};

export const BottomButtonContainer = ({
  children,
  sxstyles,
}: {
  sxstyles?: CSSProperties;
  children: ReactNode;
}) => {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "0.5rem 1rem",
        borderTop: `1px solid ${colors.divider}`,
        backgroundColor: "#0e0e0e",
        zIndex: 1000,
        ...sxstyles,
      }}
    >
      {children}
    </div>
  );
};
