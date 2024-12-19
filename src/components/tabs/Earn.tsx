import { JSX } from "react";
import { CheckAlt, Stake, Lock, Share, Receive } from "../../assets/icons";
import { colors } from "../../constants";
import friendsduel from "../../assets/images/labs/friendsduel.png";
import telemarket from "../../assets/images/labs/telemarket.png";
import "../../styles/components/tabs/earntab.css";

export const EarnTab = (): JSX.Element => {
  return (
    <section id="earntab">
      <p className="title">Earn</p>

      <div className="stakings">
        <div className="stake">
          <div className="stakedetails">
            <img src={friendsduel} alt="friendsduel" />

            <div>
              <p className="token_name">
                FRI3ND$ <span>3% APY</span>
              </p>
              <p className="min_deposit">$ 200</p>
              <p className="lockup">
                <Lock width={10} height={12} color={colors.textsecondary} /> 8
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
                TELLY <span>1.67% APY</span>
              </p>
              <p className="min_deposit">$ 100</p>
              <p className="lockup">
                <Lock width={10} height={12} color={colors.textsecondary} /> 8
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
            <img src={friendsduel} alt="friendcoin" />
            100 FRI3ND$
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
