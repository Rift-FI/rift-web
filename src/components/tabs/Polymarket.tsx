import { JSX } from "react";
import { useTabs } from "@/hooks/tabs";
import { useBackButton } from "@/hooks/backbutton";
import polymarketlogo from "../../assets/images/icons/polymarket.png";

export const Polymarket = (): JSX.Element => {
  const { switchtab } = useTabs();

  const goBack = () => {
    switchtab("home");
  };

  useBackButton(goBack);

  return (
    <div style={{ padding: "1rem" }}>
      <div className="flex flex-col gap-2 w-full bg-[#212523] rounded-xl p-2 my-4 mb-4">
        <div className="flex items-center gap-2">
          <img
            src={polymarketlogo}
            alt="polymarket"
            className="w-8 h-8 rounded-full"
          />
          <p className=" text-[#f6f7f9]">Polymarket</p>
        </div>
        <p className="text-xs text-[#f6f7f9] leading-relaxed">
          Polymarket is a platform for creating and trading prediction markets
          on Ethereum.
        </p>
        <p className="text-xs text-[#f6f7f9] text-center">Coming Soon</p>
      </div>
    </div>
  );
};
