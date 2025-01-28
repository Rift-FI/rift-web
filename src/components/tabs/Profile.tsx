import { JSX, useEffect } from "react";
import { useNavigate } from "react-router";
import { backButton, useLaunchParams } from "@telegram-apps/sdk-react";
import { Avatar } from "@mui/material";
import { useTabs } from "../../hooks/tabs";
import { colors } from "../../constants";
import refer from "../../assets/images/refer.png";
import accRecovery from "../../assets/images/icons/acc-recovery.png";
import rewards from "../../assets/images/icons/rewards.png";
import airwallex from "../../assets/images/awx.png";
import "../../styles/components/tabs/profile.scss";

export const Profile = (): JSX.Element => {
  const navigate = useNavigate();
  const { initData } = useLaunchParams();
  const { switchtab } = useTabs();

  let ethAddr = localStorage.getItem("address");
  let btcAddr = localStorage.getItem("btcaddress");
  let userhasawxkey = localStorage.getItem("userhasawxkey");

  const onRefer = () => {
    navigate("/refer");
  };

  const onRewards = () => {
    navigate("/rewards/nil");
  };

  const onimportAwx = () => {
    navigate("/importawx");
  };

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isVisible()) {
      backButton.onClick(() => switchtab("home"));
    }

    return () => {
      backButton.offClick(() => switchtab("home"));
      backButton.unmount();
    };
  }, []);

  return (
    <div className="profiletab">
      <div className="pic_uname">
        <Avatar
          src={initData?.user?.photoUrl}
          alt={initData?.user?.username}
          sx={{
            width: 120,
            height: 120,
          }}
        />

        <div className="uname">
          <p style={{ color: colors.textprimary }}>
            Hi, {initData?.user?.username} 👋
          </p>
          <p className="uid">
            ID ~ {ethAddr?.substring(2, 6)}
            {btcAddr?.substring(2, 6)}
          </p>
        </div>
      </div>

      <div className="earn" onClick={onRefer}>
        <img src={refer} alt="refer" />

        <p>
          Refer & Earn
          <span>Invite friends and earn USDC</span>
        </p>
      </div>

      <div className="earn l_earn" onClick={onRewards}>
        <img src={rewards} alt="rewards" />

        <p>
          Rewards & Airdrops
          <span>Complete tasks & unlock rewards</span>
        </p>
      </div>

      <div className="earn l_earn">
        <img src={accRecovery} alt="accoun recoverys" />

        <p>
          Account Recovery
          <span>Setup a recovery method for your account</span>
        </p>
      </div>

      {userhasawxkey == null && (
        <div className="airwallex" onClick={onimportAwx}>
          <img src={airwallex} alt="airwallex" />
        </div>
      )}
    </div>
  );
};
