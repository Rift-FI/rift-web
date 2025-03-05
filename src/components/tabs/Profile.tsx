import { JSX } from "react";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { useTabs } from "../../hooks/tabs";
import { useAppDrawer } from "../../hooks/drawer";
import { useBackButton } from "../../hooks/backbutton";
import { Lock, Refresh, Stake, Telegram } from "../../assets/icons/actions";
import { Wallet } from "../../assets/icons/security";
import { colors } from "../../constants";
import "../../styles/components/tabs/profile.scss";

export const ProfileTab = (): JSX.Element => {
  const { initData } = useLaunchParams();
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { openAppDrawer } = useAppDrawer();

  const goToSetup = () => {
    navigate("/security/setup");
  };

  const goBack = () => {
    switchtab("home");
  };

  const goToPin = () => {
    navigate("/security/pin");
  };

  const goToRecovery = () => {
    navigate("/security/recover");
  };

  const userhaspin = localStorage.getItem("userhaspin");
  const txlimit = localStorage.getItem("txlimit");

  useBackButton(goBack);

  return (
    <section id="profiletab">
      <p className="title">
        Security
        <span className="desc">
          Setup a PIN, Account recovery & a Daily Transaction Limit
        </span>
      </p>

      <div className="action pin" onClick={goToPin}>
        <p className="description">
          PIN
          <span>A PIN is required to complete transactions</span>
        </p>

        <div className="recover_action">
          <p>{userhaspin == null ? "Add a PIN" : "Change Your PIN"}</p>

          <span>
            <Lock width={16} height={18} color={colors.textsecondary} />
          </span>
        </div>
      </div>

      <div className="action recovery">
        <p className="description">
          Account Recovery
          <span>Add an Email Address and Phone Number</span>
        </p>
        <div className="recover_action" onClick={goToRecovery}>
          <p>Setup Account Recovery</p>

          <span>
            <Refresh width={16} height={17} color={colors.textsecondary} />
          </span>
        </div>
      </div>

      <div className="action">
        <p className="description">
          Daily Limit <span>Set a daily transaction limit</span>
        </p>

        <div
          className="recover_action"
          onClick={() => openAppDrawer("transactionlimit")}
        >
          <p>
            {txlimit == null ? "Set a transaction limit" : `${txlimit} HKD`}
          </p>

          <span>
            <Wallet width={20} height={18} color={colors.textsecondary} />
          </span>
        </div>
      </div>

      <div className="advanced" onClick={goToSetup}>
        <p>Advanced Security Settings</p>

        <span className="icon">
          <Stake width={6} height={12} color={colors.textprimary} />
        </span>
      </div>

      <div className="tguname">
        <p>
          <Telegram width={14} height={14} color={colors.textprimary} />@
          {initData?.user?.username}
        </p>
      </div>
    </section>
  );
};
