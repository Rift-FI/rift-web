import { JSX, useEffect } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useTabs } from "../../hooks/tabs";
import { projectType, Project } from "./lab/Project";
import startoxlogo from "../../assets/images/labs/stratox.png";
import stratocover from "../../assets/images/labs/stratoxcover.jpeg";
import mantracover from "../../assets/images/labs/mantracover.png";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";
import evidentcover from "../../assets/images/labs/evidentcover.jpg";
import evidentlogo from "../../assets/images/labs/evident.png";
import "../../styles/components/tabs/labstab.css";

export const LabsTab = (): JSX.Element => {
  const { switchtab } = useTabs();

  if (backButton.isMounted()) {
    backButton.onClick(() => {
      switchtab("home");
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
    comingSoon: false,
    link: "https://t.me/stratospherex_bot/stratospherex",
  },
  {
    images: [mantracover, mantralogo],
    title: "Mantra",
    description: "Crypto staking for the modern world.",
    category: "STAKING",
    comingSoon: true,
    link: "",
  },
];
