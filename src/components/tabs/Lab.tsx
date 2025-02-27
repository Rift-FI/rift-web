import { JSX } from "react";
import { useNavigate } from "react-router";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { projectType, Project } from "./lab/Project";
import startoxlogo from "../../assets/images/labs/stratox.png";
import stratocover from "../../assets/images/labs/stratoxcover.jpeg";
import mantracover from "../../assets/images/labs/mantracover.png";
import mantralogo from "../../assets/images/labs/mantralogo.jpeg";
import evidentcover from "../../assets/images/labs/evidentcover.jpg";
import evidentlogo from "../../assets/images/labs/evident.png";
import webcover from "../../assets/images/labs/web2cover.jpg";
import weblogo from "../../assets/images/icons/distributed.png";
import gptcover from "../../assets/images/labs/gptcover.jpg";
import gptlogo from "../../assets/images/openai-alt.png";
import yieldfarmcover from "../../assets/images/labs/yieldfarmcover.jpg";
import yieldfarmlogo from "../../assets/images/icons/lendto.png";
import "../../styles/components/tabs/labstab.scss";

export const LabsTab = (): JSX.Element => {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  useBackButton(goBack);

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
    images: [mantracover, mantralogo],
    title: "Mantra Rewards",
    description: "Earn Mantra tokens for your contribution.",
    category: "MANTRA",
    comingSoon: true,
    link: "",
  },
  {
    images: [evidentcover, evidentlogo],
    title: "Evident Capital",
    description: "Mint and manage Stable coins",
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
    images: [webcover, weblogo],
    title: "Web2 Assets",
    description: "Bring your Web2 assets on chain and monetize them",
    category: "ASSETS",
    comingSoon: true,
    link: "",
  },
  {
    images: [gptcover, gptlogo],
    title: "Free GPT",
    description: "Claim your free GPT after importing web 2 assets",
    category: "AI",
    comingSoon: true,
    link: "",
  },
  {
    images: [yieldfarmcover, yieldfarmlogo],
    title: "Techgrity Farms",
    description: "Yield farming and staking options",
    category: "YIELD FARMING",
    comingSoon: true,
    link: "",
  },
  {
    images: [mantracover, mantralogo],
    title: "Mantra Staking",
    description: "Stake your Mantra tokens for rewards",
    category: "STAKING",
    comingSoon: true,
    link: "",
  },
];
