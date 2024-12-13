import { JSX, CSSProperties, Dispatch, SetStateAction } from "react";
import { Drawer } from "@mui/material";
import { Send } from "../forms/Send";
import { SendEthFromToken } from "../forms/SendFromToken";
import { ShareWallet } from "../forms/ShareWallet";
import { ImportKey } from "../forms/ImportKey";
import { ShareKey } from "../forms/Sharekey";
import { colors } from "../../constants";

export type draweraction =
  | "send"
  | "sendfromtoken"
  | "share"
  | "sharekey"
  | "import"
  | "login";

interface drawerProps {
  action: draweraction;
  drawerOpen: boolean;
  keyToshare?: string;
  setDrawerOpen: Dispatch<SetStateAction<boolean>>;
}

export const AppDrawer = ({
  action,
  drawerOpen,
  keyToshare,
  setDrawerOpen,
}: drawerProps): JSX.Element => {
  return (
    <Drawer
      anchor={"bottom"}
      elevation={0}
      PaperProps={{ sx: drawerstyles }}
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
    >
      <div style={barstyles} />

      {action == "send" ? (
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
  height: "68vh",
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
