import { JSX, ReactNode } from "react";
import { useLaunchParams, miniApp } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";
import { Avatar } from "@mui/material";
import { useTabs } from "../hooks/tabs";
import { useBackButton } from "../hooks/backbutton";
import { useSnackbar } from "../hooks/snackbar";
import {
  Telegram,
  ArrowRight,
  Rotate,
  LogOut,
  Lock,
  Check,
} from "../assets/icons";
import { colors } from "../constants";
import "../styles/pages/profile.scss";

export default function Profile(): JSX.Element {
  const { initData } = useLaunchParams();
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
    miniApp.close();
  };

  const goToNotifications = () => {
    navigate("/notifications");
  };

  useBackButton(goBack);

  return (
    <section id="profile">
      <div className="profilepicture">
        <Avatar
          src={initData?.user?.photoUrl}
          alt={initData?.user?.username}
          sx={{ width: 100, height: 100 }}
        />

        <div className="tguid">
          <Telegram color={colors.accent} />

          <span className="id">
            @{initData?.user?.username || initData?.user?.id}
          </span>
        </div>
      </div>

      <p className="action-title">Transactions</p>
      <ProfileAction
        icon={<Rotate width={20} height={20} color={colors.textprimary} />}
        title="Transaction History"
        description="View your transaction history"
        onclick={goToNotifications}
      />

      <p className="action-title">Security</p>
      <ProfileAction
        icon={
          verifyphone == null ? (
            <Lock width={22} height={22} color={colors.textprimary} />
          ) : (
            <Check color={colors.success} />
          )
        }
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

const ProfileAction = ({
  icon,
  title,
  description,
  onclick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onclick: () => void;
}): JSX.Element => {
  return (
    <div className="profileaction" onClick={onclick}>
      <div className="icon-title-desc">
        <span className="icon">{icon}</span>
        <p className="title-desc">
          {title}
          <span className="desc">{description}</span>
        </p>
      </div>

      <ArrowRight color={colors.textsecondary} />
    </div>
  );
};
