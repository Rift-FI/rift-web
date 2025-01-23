import { JSX, useEffect } from "react";
import { useNavigate } from "react-router";
import { backButton, useLaunchParams } from "@telegram-apps/sdk-react";
import { Avatar } from "@mui/material";
import { useTabs } from "../../hooks/tabs";
import { colors } from "../../constants";
import refer from "../../assets/images/refer.png";
import accRecovery from "../../assets/images/icons/acc-recovery.png";
import "../../styles/components/tabs/profiletab.css";

export const Profile = (): JSX.Element => {
  const navigate = useNavigate();
  const { initData } = useLaunchParams();
  const { switchtab } = useTabs();

  let ethAddr = localStorage.getItem("address");
  let btcAddr = localStorage.getItem("btcaddress");

  const onRefer = () => {
    navigate("/refer");
  };
const getPremiums=()=>{
  navigate('/premiums')
}
const paymentRequest=()=>{
  navigate('/payment-request')
}
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
            ID:{ethAddr?.substring(2, 6)}
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

      <div className="earn l_earn">
        <img src={accRecovery} alt="refer" />

        <p>
          Account Recovery
          <span>Setup a recovery method for your account</span>
        </p>
      </div>
      <div className="earn l_earn" onClick={paymentRequest}>
        <img src={accRecovery} alt="paymentRequest" />

        <p>
       Payment Request 
          <span>get paid for your work</span>
        </p>
      </div>

      <div className="earn l_earn" onClick={getPremiums}>
        <img src={accRecovery} alt="premium" />

        <p>
        subscribe to Premiums 
          <span>Subricribe to our Telegram premium features and do the transaction within our app. </span>
        </p>
      </div>
    </div>
  );
};
