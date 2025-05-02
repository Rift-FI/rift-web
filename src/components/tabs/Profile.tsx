import { JSX } from "react";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import {
  faArrowRightFromBracket,
  faPhone,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useTabs } from "../../hooks/tabs";
import { useBackButton } from "../../hooks/backbutton";
import { Telegram } from "../../assets/icons/actions";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import "../../styles/components/tabs/profile.scss";
import { useSnackbar } from "@/hooks/snackbar";

export const ProfileTab = (): JSX.Element => {
  const { initData } = useLaunchParams();
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { showsuccesssnack } = useSnackbar();

  const userphone = localStorage.getItem("verifyphone");

  const goBack = () => {
    switchtab("home");
  };

  const goToRecovery = () => {
    if (userphone == null || typeof userphone == undefined) {
      navigate("/auth/phone");
    } else {
      showsuccesssnack("You're all setup");
    }
  };

  const onLogOut = () => {
    navigate("/logout");
  };

  useBackButton(goBack);

  return (
    <section id="profiletab">
      <p className="title">
        Account Security
        <span className="desc">Setup Account recovery with your phone</span>
      </p>

      <div className="action recovery">
        <p className="description">
          Account Recovery
          <span>Add a recovery Phone Number</span>
        </p>
        <div className="recover_action" onClick={goToRecovery}>
          <p>
            {userphone == null || typeof userphone == undefined
              ? "Setup a Phone Number"
              : userphone?.substring(0, 7) + "***"}
          </p>

          <span>
            <FaIcon
              faIcon={
                userphone == null || typeof userphone == undefined
                  ? faPhone
                  : faCheckCircle
              }
              color={
                userphone == null || typeof userphone == undefined
                  ? colors.textsecondary
                  : colors.success
              }
            />
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
