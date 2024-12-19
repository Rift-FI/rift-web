import { JSX, useEffect } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useTabs } from "../../hooks/tabs";
import { colors } from "../../constants";
import { ComingSoon } from "../../assets/icons";
import friendsduel from "../../assets/images/labs/friendsduel.png";
import telemarket from "../../assets/images/labs/telemarket.png";
import "../../styles/components/tabs/labstab.css";

export const LabsTab = (): JSX.Element => {
  const { switchtab } = useTabs();

  backButton.onClick(() => {
    switchtab("vault");
  });

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    return () => {
      backButton.unmount();
    };
  }, []);

  return (
    <section id="labstab">
      <p className="title">Labs</p>

      <div className="projects">
        <div className="project">
          <img src={friendsduel} alt="friendsduel" />

          <div className="about">
            <p>
              FriendsDuel
              <ComingSoon width={16} height={18} color={colors.textsecondary} />
            </p>
            <span>Create groups, send & share crypto...</span>
          </div>
        </div>

        <div className="project">
          <img src={telemarket} alt="friendsduel" />

          <div className="about">
            <p>
              Telemarket
              <ComingSoon width={16} height={18} color={colors.textsecondary} />
            </p>
            <span>Modern crypto trading</span>
          </div>
        </div>
      </div>
    </section>
  );
};
