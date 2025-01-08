import { JSX, useEffect, CSSProperties } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { Drawer } from "@mui/material";
import { useAppDrawer } from "../../hooks/drawer";
import { SendOptions } from "../forms/SendReciev";
import { Send } from "../forms/Send";
import { SendEthFromToken } from "../forms/SendFromToken";
import { ShareWallet } from "../forms/ShareWallet";
import { ImportKey } from "../forms/ImportKey";
import { ShareKey } from "../forms/Sharekey";
import { ConsumeSharedKey } from "../forms/ConsumeKey";
import { SendUsdt } from "../forms/SendUsdt";
import { SendBtc } from "../forms/SendBtc";
import { ReferEarn } from "../forms/ReferEarn";
import { colors } from "../../constants";

export const AppDrawer = (): JSX.Element => {
  const { action, drawerOpen, closeAppDrawer, keyToshare } = useAppDrawer();

  const onCloseDrawer = () => {
    if (backButton.isMounted()) {
      backButton.hide();
      backButton.unmount();
    }

    closeAppDrawer();
  };

  if (drawerOpen && backButton.isMounted()) {
    backButton.onClick(() => {
      onCloseDrawer();
    });
  }

  useEffect(() => {
    if (drawerOpen && backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    return () => {
      backButton.unmount();
    };
  }, [drawerOpen]);

  return (
    <Drawer
      anchor={"bottom"}
      elevation={0}
      PaperProps={{ sx: drawerstyles }}
      open={drawerOpen}
      onClose={() => onCloseDrawer()}
    >
      <div style={barstyles} />

      {action == "sendoptions" ? (
        <SendOptions />
      ) : action == "send" ? (
        <Send />
      ) : action == "sendfromtoken" ? (
        <SendEthFromToken />
      ) : action == "share" ? (
        <ShareWallet />
      ) : action == "sharekey" ? (
        <ShareKey keyToShare={keyToshare as string} />
      ) : action == "consumekey" ? (
        <ConsumeSharedKey />
      ) : action == "sendusdt" ? (
        <SendUsdt />
      ) : action == "sendbtc" ? (
        <SendBtc />
      ) : action == "refer" ? (
        <ReferEarn />
      ) : (
        <ImportKey />
      )}
    </Drawer>
  );
};

const drawerstyles: CSSProperties = {
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  width: "100vw",
  height: "72vh",
  padding: "0.25rem",
  borderTopLeftRadius: "0.5rem",
  borderTopRightRadius: "0.5rem",
  zIndex: 4000,
  backgroundColor: colors.primary,
};

const barstyles: CSSProperties = {
  width: "6rem",
  height: "0.25rem",
  marginTop: "0.5rem",
  borderRadius: "0.25rem",
  backgroundColor: colors.divider,
};
