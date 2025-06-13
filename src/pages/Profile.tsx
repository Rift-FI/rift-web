import { JSX, ReactNode } from "react";
import { usePlatformDetection } from "../utils/platform";
import { miniApp } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { Avatar } from "@mui/material";
import { useTabs } from "../hooks/tabs";
import { useBackButton } from "../hooks/backbutton";
import { useSnackbar } from "../hooks/snackbar";
import { Telegram, ArrowRight, Wallet, LogOut, Lock } from "../assets/icons";
import { colors } from "../constants";
import "../styles/pages/profile.scss";

export default function Profile(): JSX.Element {
  const { isTelegram, telegramUser } = usePlatformDetection();
  const navigate = useNavigate();
  const { switchtab } = useTabs();
  const { showsuccesssnack } = useSnackbar();

  const verifyphone = localStorage.getItem("verifyphone");

  const goBack = () => {
    switchtab("home");
    navigate("/app");
  };

  const onAddPhone = () => {
    if (verifyphone == null || typeof verifyphone == undefined) {
      navigate("/auth/phone");
    } else {
      showsuccesssnack("Your'e all set");
    }
  };

  const onLogOut = () => {
    localStorage.clear();
    if (isTelegram) {
      miniApp.close();
    } else {
      // For browser mode, redirect to home or show logout message
      navigate("/");
    }
  };

  const goToNotifications = () => {
    navigate("/notifications");
  };

  useBackButton(goBack);

  return (
    <section id="profile">
      <div className="profilepicture">
        <Avatar
          src={isTelegram ? telegramUser?.photoUrl : undefined}
          alt={isTelegram ? telegramUser?.username : "User"}
          sx={{ width: 100, height: 100 }}
        />

        <div className="tguid">
          {isTelegram ? (
            <>
              <Telegram color={colors.accent} />
              <span className="id">
                @{telegramUser?.username || telegramUser?.id}
              </span>
            </>
          ) : (
            <span className="id">Browser User</span>
          )}
        </div>
      </div>

      <p className="action-title">Transactions</p>
      <ProfileAction
        icon={<Wallet width={22} height={20} color={colors.textprimary} />}
        title="Transaction History"
        description="View your transaction history"
        onclick={goToNotifications}
      />

      <p className="action-title">Security</p>
      <ProfileAction
        icon={<Lock width={22} height={22} color={colors.textprimary} />}
        title="Phone"
        description={
          verifyphone == null
            ? "Verify with your phone number"
            : "Your'e all set"
        }
        onclick={onAddPhone}
      />
      <ProfileAction
        icon={<LogOut width={22} height={24} color={colors.danger} />}
        title="Log Out"
        description="Sign out of Sphere"
        onclick={onLogOut}
      />
    </section>
  );
}

interface profileactionprops {
  icon: ReactNode;
  title: string;
  description: string;
  onclick: () => void;
}

const ProfileAction = ({
  icon,
  title,
  description,
  onclick,
}: profileactionprops): JSX.Element => (
  <div className="profileaction" onClick={onclick}>
    <div className="leadingsection">
      {icon}

      <div className="textcontent">
        <span className="actiontitle">{title}</span>

        <span className="actiondescription">{description}</span>
      </div>
    </div>

    <ArrowRight color={colors.textsecondary} />
  </div>
);
