import { JSX } from "react";
import { useNavigate } from "react-router";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { Avatar } from "@mui/material";
import { useTabs } from "../../hooks/tabs";
import { colors } from "../../constants";
import refer from "../../assets/images/refer.png";
import staking from "../../assets/images/icons/staking.png";
import "../../styles/components/tabs/profiletab.css";

export const Profile = (): JSX.Element => {
  const navigate = useNavigate();
  const { initData } = useLaunchParams();
  const { switchtab } = useTabs();

  const onRefer = () => {
    navigate("/refer");
  };

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
        </div>
      </div>

      <div className="earn" onClick={onRefer}>
        <img src={refer} alt="refer" />

        <p>
          Refer & Earn
          <span>Invite friends and earn USDC</span>
        </p>
      </div>

      <div className="earn l_earn" onClick={() => switchtab("earn")}>
        <img src={staking} alt="refer" />

        <p>
          Crypto Staking
          <span>Stake your crypto securely and earn yields</span>
        </p>
      </div>
    </div>
  );
};
