import { JSX } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { coinType } from "../../types/earn";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { fetchCoins } from "../../utils/api/market";
import { Coins } from "./defi/Coins";
import "../../styles/components/tabs/defitab.scss";

export const DefiTab = (): JSX.Element => {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const { data, isLoading } = useQuery({
    queryKey: ["coins"],
    queryFn: fetchCoins,
    refetchInterval: 3000,
  });

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  useBackButton(goBack);

  return (
    <section id="defitab">
      <Coins coinsLoading={isLoading} coinsdata={data as coinType[]} />
    </section>
  );
};
