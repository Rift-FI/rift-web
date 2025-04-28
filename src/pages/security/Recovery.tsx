import { JSX, ReactNode } from "react";
import { useNavigate } from "react-router";
import { faPhone, faAt, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useBackButton } from "../../hooks/backbutton";
import { useTabs } from "../../hooks/tabs";
import { useAppDrawer } from "../../hooks/drawer";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";
import email from "../../assets/images/icons/email.png";
import phone from "../../assets/images/icons/phone.png";
import "../../styles/pages/security/recovery.scss";

export default function RecoverySetup(): JSX.Element {
  const navigate = useNavigate();
  const { switchtab } = useTabs();

  const useremail = localStorage.getItem("useremail");
  const userphone = localStorage.getItem("userphone");

  const goBack = () => {
    switchtab("profile");
    navigate("/app");
  };

  const goToEmail = () => {
    navigate("/security/email");
  };

  const goToPhone = () => {
    navigate("/security/phone");
  };

  useBackButton(goBack);

  return (
    <section id="recoverysetup">
      <div className="images">
        <img src={email} alt="email" />
        <div className="divider"></div>
        <img src={phone} alt="phone" />
      </div>

      <p className="description">Setup Account Recovery</p>
      <p className="cdescription">
        You can use your recovery phone / email to restore your Sphere account
      </p>

      <div className="devices">
        {useremail !== null && (
          <RecoveryDevice
            isEmailAddr
            recoveryValue={useremail}
            sxClassname="email_device"
          />
        )}

        {userphone !== null && <RecoveryDevice recoveryValue={userphone} />}
      </div>

      <div className="actions">
        <RecoveryAction
          title="Add an Email Address"
          icon={<FaIcon faIcon={faAt} color={colors.textsecondary} />}
          onclick={goToEmail}
        />

        <RecoveryAction
          title="Add a Phone Number"
          icon={<FaIcon faIcon={faPhone} color={colors.textsecondary} />}
          onclick={goToPhone}
        />
      </div>
    </section>
  );
}

const RecoveryAction = ({
  title,
  icon,
  onclick,
}: {
  title: string;
  icon: ReactNode;
  onclick: () => void;
}): JSX.Element => {
  return (
    <div className="recover_action" onClick={onclick}>
      <p>{title}</p>

      <span>{icon}</span>
    </div>
  );
};

const RecoveryDevice = ({
  isEmailAddr,
  recoveryValue,
  sxClassname,
}: {
  isEmailAddr?: boolean;
  recoveryValue: string;
  sxClassname?: string;
}): JSX.Element => {
  const { openAppDrawerWithKey } = useAppDrawer();

  const displayemailuname = recoveryValue?.split("@")[0];
  const displayemaildomain = recoveryValue?.split("@")[1];

  const deleteEmail = () => {
    openAppDrawerWithKey(
      "deleteemail",
      recoveryValue as string,
      "delete-email"
    );
  };

  const deletePhone = () => {
    openAppDrawerWithKey(
      "deletephone",
      recoveryValue as string,
      "delete-phone"
    );
  };

  return (
    <div className={`device ${sxClassname}`}>
      <div className="icon_detail">
        <span className="icons">
          {isEmailAddr ? (
            <FaIcon faIcon={faAt} color={colors.textprimary} />
          ) : (
            <FaIcon faIcon={faPhone} color={colors.textprimary} />
          )}
        </span>

        <p>
          {isEmailAddr ? (
            <>
              {displayemailuname?.substring(0, 5)}***{displayemaildomain}
            </>
          ) : (
            <>
              {recoveryValue?.substring(0, 3)}***
              {recoveryValue?.substring(
                recoveryValue?.length / 2,
                recoveryValue?.length / 2 + 3
              )}
            </>
          )}
          <span>{navigator.userAgent?.substring(0, 32)}...</span>
        </p>
      </div>

      <button onClick={isEmailAddr ? deleteEmail : deletePhone}>
        <FaIcon faIcon={faTrash} color={colors.danger} />
      </button>
    </div>
  );
};
