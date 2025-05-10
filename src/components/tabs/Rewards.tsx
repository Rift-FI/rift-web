import { JSX } from "react";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import "../../styles/components/tabs/rewards.scss";

export const Rewards = (): JSX.Element => {
  const { switchtab } = useTabs();

  const goBack = () => {
    switchtab("home");
  };

  useBackButton(goBack);

  return <section id="rewards"></section>;
};
