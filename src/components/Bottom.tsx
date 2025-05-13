import { CSSProperties, JSX, ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useTabs, tabsType } from "../hooks/tabs";
import { useAppDialog } from "../hooks/dialog";
import { useSnackbar } from "../hooks/snackbar";
import {
  registerWithIdentifier,
  signinWithIdentifier,
} from "../utils/polymarket/auth";
import { Home, Exchange, Shield, Gift } from "../assets/icons";
import { colors } from "../constants";
import "../styles/components/tabs/bottomtab.scss";

type tabMenus = {
  menu: tabsType;
  title: string;
  icon: ReactNode;
};

export const BottomTabNavigation = (): JSX.Element => {
  const { initData } = useLaunchParams();
  const { currTab, switchtab } = useTabs();
  const { openAppDialog, closeAppDialog } = useAppDialog();
  const { showerrorsnack } = useSnackbar();

  const tgUid = initData?.user?.id;
  const ethaddress: string | null = localStorage.getItem("ethaddress");

  const { mutate: polymarketRegister } = useMutation({
    mutationFn: () =>
      registerWithIdentifier(String(tgUid), ethaddress as string)
        .then((res) => {
          if (res?.token) {
            localStorage.setItem("polymarkettoken", res?.token);
            closeAppDialog();
            switchtab("polymarket");
          } else {
            showerrorsnack("Sorry, we couldn't setup polymarket for you");
            closeAppDialog();
          }
        })
        .catch(() => {
          showerrorsnack("Sorry, we couldn't setup polymarket for you");
          closeAppDialog();
        }),
  });

  const { mutate: polymarketSignIn } = useMutation({
    mutationFn: () =>
      signinWithIdentifier(String(tgUid))
        .then((res) => {
          if (res?.token) {
            localStorage.setItem("polymarkettoken", res?.token);
            closeAppDialog();
            switchtab("polymarket");
          } else {
            polymarketRegister();
          }
        })
        .catch(() => {
          showerrorsnack("Sorry, we couldn't setup polymarket for you");
          closeAppDialog();
        }),
  });

  const onPolymarket = () => {
    openAppDialog("loading", "Setting things up, please wait...");
    polymarketSignIn();
  };

  const bottomtabMenus: tabMenus[] = [
    {
      menu: "home",
      title: "Home",
      icon: (
        <Home
          color={currTab == "home" ? colors.textprimary : colors.textsecondary}
        />
      ),
    },
    {
      menu: "keys",
      title: "Keys",
      icon: (
        <Shield
          color={currTab == "keys" ? colors.textprimary : colors.textsecondary}
        />
      ),
    },
    {
      menu: "rewards",
      title: "Rewards",
      icon: (
        <Gift
          color={
            currTab == "rewards" ? colors.textprimary : colors.textsecondary
          }
        />
      ),
    },
    {
      menu: "polymarket",
      title: "Polymarktet",
      icon: (
        <Exchange
          color={
            currTab == "polymarket" ? colors.textprimary : colors.textsecondary
          }
        />
      ),
    },
  ];

  return (
    <div id="bottomtab">
      {bottomtabMenus?.map((bottomtab, index) => (
        <button
          key={index + bottomtab?.title}
          onClick={
            bottomtab.menu == "polymarket"
              ? () => onPolymarket()
              : () => switchtab(bottomtab.menu)
          }
          className={currTab === bottomtab.menu ? "active" : ""}
        >
          {bottomtab?.icon}
          {bottomtab?.title}
        </button>
      ))}
    </div>
  );
};

export const BottomButtonContainer = ({
  children,
  sxstyles,
}: {
  sxstyles?: CSSProperties;
  children: ReactNode;
}) => {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "0.5rem 1rem",
        borderTop: `1px solid ${colors.divider}`,
        backgroundColor: "#0e0e0e",
        zIndex: 1000,
        ...sxstyles,
      }}
    >
      {children}
    </div>
  );
};
