import { JSX, useEffect } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { useTabs } from "../hooks/tabs";
import dollar from "../assets/icons/dollar.svg";
import "../styles/pages/staking.scss";

export default function Staking(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isVisible()) {
      backButton.onClick(goBack);
    }

    return () => {
      backButton.offClick(goBack);
      backButton.unmount();
    };
  }, []);

  return (
    <section id="staking">
      {products.map((product, index) => (
        <div className="stakeproduct" key={index + product.apy}>
          <p className="sub">Product</p>
          <p className="title">{product.name}</p>

          <div className="img_ctr">
            <img src={dollar} alt="fiat" />
          </div>

          <p className="sub">APY</p>
          <p className="title">{product.apy}</p>

          <div className="value">
            <p>
              Current TVL <span>{product.currentTvl}</span>
            </p>
            <p className="last-child">
              Max Capacity <span>{product.maxCapacity}</span>
            </p>
          </div>

          <p className="network">
            Nextwork <span>{product.network}</span>
          </p>

          <button className="start">Start Earning</button>
        </div>
      ))}
    </section>
  );
}

type stakeproduct = {
  name: string;
  apy: string;
  currentTvl: string;
  maxCapacity: string;
  network: string;
};

const products: stakeproduct[] = [
  {
    name: "Super Senior",
    apy: "11%",
    currentTvl: "$22,698,886.84",
    maxCapacity: "$26,000,000",
    network: "Polygon",
  },
  {
    name: "Junior",
    apy: "29%",
    currentTvl: "$22,698,886.84",
    maxCapacity: "$26,000,000",
    network: "Polygon",
  },
];
