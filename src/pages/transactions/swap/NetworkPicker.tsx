import { useNavigate } from "react-router";
import { useBackButton } from "@/hooks/backbutton";
import { RadioButton } from "../../../components/global/Radios";
import ethlogo from "../../../assets/images/logos/eth.png";
import arbitrumlogo from "../../../assets/images/logos/arbitrum.png";
import optimismlogo from "../../../assets/images/logos/optimism.png";
import baselogo from "../../../assets/images/logos/base.png";
import "../../../styles/pages/transactions/swap/networkpicker.scss";

export type networks = "ETHEREUM" | "ARBITRUM" | "BASE" | "OPTIMISM";
export type token = {
  symbol: string;
  logo: string;
  address: string;
  balance: string;
};

export default function NetworkPicker() {
  const navigate = useNavigate();

  const useArbitrum = () => {
    navigate("/swap/ARBITRUM");
  };

  // const useEthereum = () => {
  //   navigate("/swap/ETHEREUM");
  // };

  // const useBase = () => {
  //   navigate("/swap/BASE");
  // };

  // const useOptimism = () => {
  //   navigate("/swap/OPTIMISM");
  // };

  const goBack = () => {
    navigate("/app");
  };

  useBackButton(goBack);

  return (
    <section id="networkpicker">
      <p className="title">
        Swap
        <span>To gest started with swapping tokens, choose a network</span>
      </p>

      <div className="pickers">
        <RadioButton
          image={arbitrumlogo}
          title="Arbitrum"
          ischecked={false}
          isRadio={false}
          onclick={useArbitrum}
        />

        <RadioButton
          image={ethlogo}
          title="Ethereum"
          description="Ethereum Mainnet"
          ischecked={false}
          isRadio={false}
          disabled
          onclick={() => {}}
        />

        <RadioButton
          image={optimismlogo}
          title="Optimism"
          ischecked={false}
          isRadio={false}
          disabled
          onclick={() => {}}
        />

        <RadioButton
          image={baselogo}
          title="Base"
          ischecked={false}
          isRadio={false}
          disabled
          onclick={() => {}}
        />
      </div>
    </section>
  );
}
