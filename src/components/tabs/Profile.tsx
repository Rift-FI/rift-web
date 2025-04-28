import { JSX } from "react";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import {
  faLock,
  faRotateRight,
  faWallet,
  faArrowRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { useTabs } from "../../hooks/tabs";
import { useAppDrawer } from "../../hooks/drawer";
import { useBackButton } from "../../hooks/backbutton";
import { Telegram } from "../../assets/icons/actions";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import "../../styles/components/tabs/profile.scss";

export const ProfileTab = (): JSX.Element => {
  const { initData } = useLaunchParams();
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { openAppDrawer } = useAppDrawer();

  const goBack = () => {
    switchtab("home");
  };

  const goToPin = () => {
    navigate("/security/pin");
  };

  const goToRecovery = () => {
    navigate("/security/recover");
  };

  const onLogOut = () => {
    navigate("/logout");
  };

  const userhaspin = localStorage.getItem("userhaspin");
  const txlimit = localStorage.getItem("txlimit");

  useBackButton(goBack);

  return (
    <section id="profiletab">
      <p className="title">
        Account Security
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
            <FaIcon faIcon={faLock} color={colors.textsecondary} />
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
            <FaIcon faIcon={faRotateRight} color={colors.textsecondary} />
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
            <FaIcon faIcon={faWallet} color={colors.textsecondary} />
          </span>
        </div>
      </div>

      <button className="logout" onClick={onLogOut}>
        Log Out
        <FaIcon
          faIcon={faArrowRightFromBracket}
          color={colors.danger}
          fontsize={14}
        />
      </button>

      <div className="tguname">
        <p>
          <Telegram width={14} height={14} color={colors.textprimary} />@
          {initData?.user?.username || initData?.user?.id}
        </p>
      </div>
    </section>
  );
};
