import { JSX, useEffect } from "react";
import { useNavigate } from "react-router";
import { backButton, useLaunchParams } from "@telegram-apps/sdk-react";
import { Avatar } from "@mui/material";
import { useTabs } from "../../hooks/tabs";
import { colors } from "../../constants";
import refer from "../../assets/images/icons/refer.png";
import "../../styles/components/tabs/profile.scss";

export const Profile = (): JSX.Element => {
  const { initData } = useLaunchParams();
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  let ethAddr = localStorage.getItem("address");
  let btcAddr = localStorage.getItem("btcaddress");

  const onRefer = () => {
    navigate("/refer/refer");
  };

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
    </div>
  );
};
