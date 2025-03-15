import { JSX } from "react";
import { useNavigate, useParams } from "react-router";
import { useTabs } from "../../hooks/tabs";
import { useBackButton } from "../../hooks/backbutton";

export default function LaunchPadInfo(): JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const goBack = () => {
    switchtab("earn");
    navigate("/app");
  };

  useBackButton(goBack);

  return <section id="launchpadinfo">Launchpad {id} info</section>;
}
