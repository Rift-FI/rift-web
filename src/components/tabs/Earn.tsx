import { JSX, useEffect } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useTabs } from "../../hooks/tabs";
import { Stake, Lock } from "../../assets/icons";
import { colors } from "../../constants";
import friendsduel from "../../assets/images/labs/friendsduel.png";
import telemarket from "../../assets/images/labs/telemarket.png";
import "../../styles/components/tabs/earntab.css";

export const EarnTab = (): JSX.Element => {
  const { switchtab } = useTabs();

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isVisible()) {
      backButton.onClick(() => switchtab("profile"));
    }

    return () => {
      backButton.offClick(() => switchtab("profile"));
      backButton.unmount();
    };
  }, []);

  return (
    <section id="earntab">
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
    </section>
  );
};
