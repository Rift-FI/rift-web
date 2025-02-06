import { JSX, useEffect } from "react";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { backButton } from "@telegram-apps/sdk-react";
import { useTabs } from "../../hooks/tabs";
import { useAppDrawer } from "../../hooks/drawer";
import { Lock, Stake, Telegram } from "../../assets/icons/actions";
import { Email, Phone, Wallet } from "../../assets/icons/security";
import { colors } from "../../constants";
import "../../styles/components/tabs/security.scss";

export const SecurityTab = (): JSX.Element => {
  const { initData } = useLaunchParams();
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { openAppDrawer } = useAppDrawer();

  const goToSetup = () => {
    navigate("/security/setup");
  };

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  const txlimit = localStorage.getItem("txlimit");

  useEffect(() => {
    if (backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isMounted()) {
      backButton.onClick(goBack);
    }

    return () => {
      backButton.offClick(goBack);
      backButton.unmount();
    };
  }, []);

  return (
    <section id="securitytab">
      <p className="title">
        Security
        <span className="desc">
          Setup a PIN, Account recovery & a Daily Transaction Limit
        </span>
      </p>

      <div className="action pin">
        <p className="description">
          PIN
          <span>A PIN is required to complete transactions</span>
        </p>

        <div className="recover_action">
          <p>Add a PIN</p>

          <span>
            <Lock width={16} height={18} color={colors.textsecondary} />
          </span>
        </div>
      </div>

      <div className="action recovery">
        <p className="description">
          Account Recovery
          <span>Add an extra layer of security</span>
        </p>
        <div className="recover_action">
          <p>Add an Email Address</p>

          <span>
            <Email width={16} height={16} color={colors.textsecondary} />
          </span>
        </div>

        <div className="recover_action">
          <p>Add a Phone Number</p>

          <span>
            <Phone width={16} height={16} color={colors.textsecondary} />
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
