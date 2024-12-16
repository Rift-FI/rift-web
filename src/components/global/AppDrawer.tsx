import { JSX, CSSProperties } from "react";
import { Drawer } from "@mui/material";
import { useAppDrawer } from "../../hooks/drawer";
import { SendOptions } from "../forms/SendReciev";
import { Send } from "../forms/Send";
import { SendEthFromToken } from "../forms/SendFromToken";
import { ShareWallet } from "../forms/ShareWallet";
import { ImportKey } from "../forms/ImportKey";
import { ShareKey } from "../forms/Sharekey";
import { Cancel } from "../../assets/icons";
import { colors } from "../../constants";

export const AppDrawer = (): JSX.Element => {
  const { action, drawerOpen, closeAppDrawer, keyToshare } = useAppDrawer();

  return (
    <Drawer
      anchor={"bottom"}
      elevation={0}
      PaperProps={{ sx: drawerstyles }}
      open={drawerOpen}
      onClose={() => closeAppDrawer()}
    >
      <div style={barstyles} />
      <button
        style={{
          position: "absolute",
          top: "0.25rem",
          right: "0.25rem",
          padding: "0.25rem",
          backgroundColor: "transparent",
          border: 0,
          outline: "none",
          outlineColor: "transparent",
        }}
        className="close"
        onClick={() => closeAppDrawer()}
      >
        <Cancel width={24} height={24} color={colors.textsecondary} />
      </button>

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
