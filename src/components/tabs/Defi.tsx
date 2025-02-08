import { JSX, useEffect } from "react";
import { useNavigate } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { useTabs } from "../../hooks/tabs";
import { Stake, Lock } from "../../assets/icons/actions";
import { colors } from "../../constants";
import { Coins } from "./defi/Coins";
import friendsduel from "../../assets/images/labs/friendsduel.png";
import telemarket from "../../assets/images/labs/telemarket.png";
import lendtospend from "../../assets/images/icons/lendto.png";
import "../../styles/components/tabs/defitab.scss";

export const DefiTab = (): JSX.Element => {
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
    <section id="defitab">
      <p className="title">Earn</p>

      <p className="yt_title">Yield Tokens</p>
      <div className="stakings">
        <div className="stake">
          <div className="stakedetails">
            <img src={friendsduel} alt="friendsduel" />

            <div>
              <p className="token_name">
                ESHOP <span>10% APY | Monthly Dividend</span>
              </p>
              <p className="min_deposit">$ 200</p>
              <p className="lockup">
                <Lock width={10} height={12} color={colors.textsecondary} /> -
              </p>
            </div>
          </div>

          <button>
            Stake Now <Stake color={colors.textprimary} />
          </button>
        </div>

        <div className="stake">
          <div className="stakedetails">
            <img src={telemarket} alt="friendsduel" />

            <div>
              <p className="token_name">
                ESHOP / USDC LP <span>15% APY | Monthly Dividend</span>
              </p>
              <p className="min_deposit">$ 100</p>
              <p className="lockup">
                <Lock width={10} height={12} color={colors.textsecondary} /> -
              </p>
            </div>
          </div>

          <button>
            Stake Now <Stake color={colors.textprimary} />
          </button>
        </div>
      </div>

      <p className="yt_title">Staking</p>
      <div className="stakings">
        <div className="stake">
          <div className="stakedetails">
            <img src={friendsduel} alt="friendsduel" />

            <div>
              <p className="token_name">
                ESHOP / USDC LP <span>12% APY</span>
              </p>
              <p className="min_deposit">$ 200</p>
              <p className="lockup">
                <Lock width={10} height={12} color={colors.textsecondary} /> 12
                Months
              </p>
            </div>
          </div>

          <button>
            Stake Now <Stake color={colors.textprimary} />
          </button>
        </div>

        <div className="stake">
          <div className="stakedetails">
            <img src={telemarket} alt="friendsduel" />

            <div>
              <p className="token_name">
                ESHOP / USDC LP <span>30% APY</span>
              </p>
              <p className="min_deposit">$ 100</p>
              <p className="lockup">
                <Lock width={10} height={12} color={colors.textsecondary} /> 12
                Months
              </p>
            </div>
          </div>

          <button>
            Stake Now <Stake color={colors.textprimary} />
          </button>
        </div>

        <div className="stake">
          <div className="stakedetails">
            <img src={telemarket} alt="friendsduel" />

            <div>
              <p className="token_name">
                ESHOP / USDC LP <span>73% APY</span>
              </p>
              <p className="min_deposit">$ 100</p>
              <p className="lockup">
                <Lock width={10} height={12} color={colors.textsecondary} /> 12
                Months
              </p>
            </div>
          </div>

          <button>
            Stake Now <Stake color={colors.textprimary} />
          </button>
        </div>
      </div>

      <Coins />

      <div className="lendtospend" onClick={() => navigate("/lend")}>
        <img src={lendtospend} alt="lend to spend" />

        <p>
          Lend & Earn <br />
          <span>Allow others to use your crypto assets and secrets</span>
        </p>
      </div>
    </section>
  );
};
