import { JSX, CSSProperties } from "react";
import { Drawer } from "@mui/material";
import { useAppDrawer } from "../../hooks/drawer";
import { SendEthFromToken } from "../forms/SendFromToken";
import { ConsumeSharedKey } from "../forms/ConsumeKey";
import { QuickActions } from "../drawer/QuickActions";
import { UnlockTransactions } from "../drawer/UnlockTransactions";
import { NodeTeeSelector } from "../tabs/security/NodeTeeSelector";
import { SendAirdropLink } from "../drawer/SendAirdropLink";
import { TransactionLimit } from "../drawer/TransactionLimit";
import { colors } from "../../constants";

export const AppDrawer = (): JSX.Element => {
  const { action, drawerOpen, closeAppDrawer } = useAppDrawer();

  return (
    <Drawer
      anchor={"bottom"}
      elevation={0}
      PaperProps={{
        sx: {
          ...drawerstyles,
          height: action == "transactionlimit" ? "45vh" : "39vh",
        },
      }}
      open={drawerOpen}
      onClose={() => closeAppDrawer()}
    >
      <div style={barstyles} />

      {action == "collectfromwallet" ? (
        <SendEthFromToken />
      ) : action == "consumekey" ? (
        <ConsumeSharedKey />
      ) : action == "quickactions" ? (
        <QuickActions />
      ) : action == "unlocktransactions" ? (
        <UnlockTransactions />
      ) : action == "sendairdroplink" ? (
        <SendAirdropLink />
      ) : action == "transactionlimit" ? (
        <TransactionLimit />
      ) : (
        <NodeTeeSelector />
      )}
    </Drawer>
  );
};

const drawerstyles: CSSProperties = {
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  width: "100vw",
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
