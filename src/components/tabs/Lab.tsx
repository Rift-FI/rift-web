import { JSX, useEffect } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { useTabs } from "../../hooks/tabs";
import { projectType, Project } from "./lab/Project";
import startoxlogo from "../../assets/images/labs/stratox.png";
import stratocover from "../../assets/images/labs/stratoxcover.jpeg";
import mantracover from "../../assets/images/labs/mantracover.png";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";
import evidentcover from "../../assets/images/labs/evidentcover.jpg";
import evidentlogo from "../../assets/images/labs/evident.png";
import rewards from "../../assets/images/icons/rewards.png";
import "../../styles/components/tabs/labstab.scss";

export const LabsTab = (): JSX.Element => {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  const onRewards = () => {
    navigate("/rewards/nil");
  };

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(goBack);
    }

    return () => {
      backButton.offClick(goBack);
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

      <div className="earn" onClick={onRewards}>
        <img src={rewards} alt="rewards" />

        <p>
          Rewards & Airdrops
          <span>Complete tasks & unlock rewards</span>
        </p>
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
