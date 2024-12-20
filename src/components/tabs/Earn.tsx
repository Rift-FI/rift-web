import { JSX, useEffect } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { useTabs } from "../../hooks/tabs";
import { CheckAlt, Stake, Lock, Share, Receive } from "../../assets/icons";
import { colors } from "../../constants";
import friendsduel from "../../assets/images/labs/friendsduel.png";
import telemarket from "../../assets/images/labs/telemarket.png";
import usdc from "../../assets/images/labs/usdc.png";
import "../../styles/components/tabs/earntab.css";

export const EarnTab = (): JSX.Element => {
  const { switchtab } = useTabs();

  backButton.onClick(() => {
    switchtab("vault");
  });

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    return () => {
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

      <p className="m_title">Missions</p>
      <div className="missions">
        <div className="mission">
          <p className="_title">Refer & Earn</p>

          <span>
            <p>
              10 / 20
              <CheckAlt color={colors.textsecondary} />
            </p>

            <button className="referr">
              <Share width={15} height={19} color={colors.textprimary} />
            </button>
          </span>

          <div className="progress_ctr">
            <div className="progress" />
          </div>
        </div>
      </div>

      <p className="m_title">My Earnings</p>
      <div className="claims">
        <div className="claim">
          <span>
            <img src={usdc} alt="friendcoin" />
            100 USDC
          </span>

          <button>
            Claim
            <Receive width={18} height={18} color={colors.textsecondary} />
          </button>
        </div>
      </div>
    </section>
  );
};
