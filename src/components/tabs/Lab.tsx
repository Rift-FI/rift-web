import { JSX, useEffect } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useTabs } from "../../hooks/tabs";
import { projectType, Project } from "./lab/Project";
import startoxlogo from "../../assets/images/labs/stratox.png";
import stratocover from "../../assets/images/stratoxcover.png";
import mantracover from "../../assets/images/labs/mantracover.jpeg";
import telemarket from "../../assets/images/labs/telemarket.png";
import evidentcover from "../../assets/images/labs/evidentcover.png";
import evidentlogo from "../../assets/images/labs/evident.png";
import "../../styles/components/tabs/labstab.css";

export const LabsTab = (): JSX.Element => {
  const { switchtab } = useTabs();

  if (backButton.isMounted()) {
    backButton.onClick(() => {
      switchtab("vault");
    });
  }

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
        {projects?.map((_project, idx) => (
          <Project
            key={Math.random() + idx}
            images={_project?.images}
            title={_project?.title}
            description={_project?.description}
            category={_project?.category}
            comingSoon={_project?.comingSoon}
            link={_project?.link}
          />
        ))}
      </div>
    </section>
  );
};

const projects: projectType[] = [
  {
    images: [evidentcover, evidentlogo],
    title: "Evident Capital",
    description: "Convert fiat to stablecoins",
    category: "STABLECOINS",
    comingSoon: false,
    link: "https://t.me/evident_capital_bot/evident",
  },
  {
    images: [stratocover, startoxlogo],
    title: "StratosphereX",
    description: "A DEX for interoperability trading.",
    category: "DEX",
    comingSoon: true,
    link: "https://t.me/stratospherex_bot/stratospherex",
  },
  {
    images: [mantracover, telemarket],
    title: "Mantra Staking",
    description: "Crypto staking for the modern world.",
    category: "STAKING",
    comingSoon: true,
    link: "",
  },
];
