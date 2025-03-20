import { JSX, CSSProperties } from "react";
import { Drawer } from "@mui/material";
import { useAppDrawer } from "../../hooks/drawer";
import { CollectCryptoFromLink } from "../forms/CollectCryptoFromLink";
import { UnlockTransactions } from "../drawer/UnlockTransactions";
import { NodeTeeSelector } from "../tabs/security/NodeTeeSelector";
import { SendAirdropLink } from "../drawer/SendAirdropLink";
import { TransactionLimit } from "../drawer/TransactionLimit";
import { DeleteRecovery } from "../drawer/DeleteRecovery";
import { RevokeSecretAccess } from "../drawer/RevokeSecretAccess";
import { CreateKey } from "../drawer/CreateKey";
import { SwapPst } from "../drawer/SwapPst";
import { SendLendLink } from "../drawer/SendLendLink";
import { ClaimLendCryptoLink } from "../drawer/ClaimLendCryptoLink";
import { ConsumeAwxKey } from "../forms/ConsumeAwxKey";
import { colors } from "../../constants";

export const AppDrawer = (): JSX.Element => {
  const { action, drawerOpen, closeAppDrawer } = useAppDrawer();

  return (
    <Drawer
      anchor={"bottom"}
      elevation={0}
      slotProps={{
        paper: {
          sx: {
            ...drawerstyles,
            height:
              action == "swappst"
                ? "65vh"
                : action == "transactionlimit"
                ? "45vh"
                : "39vh",
          },
        },
      }}
      open={drawerOpen}
      onClose={() => closeAppDrawer()}
    >
      {action !== "swappst" && <div style={barstyles} />}

      {action == "collectfromwallet" ? (
        <CollectCryptoFromLink />
      ) : action == "unlocktransactions" ? (
        <UnlockTransactions />
      ) : action == "sendairdroplink" ? (
        <SendAirdropLink />
      ) : action == "transactionlimit" ? (
        <TransactionLimit />
      ) : action == "deleteemail" || action == "deletephone" ? (
        <DeleteRecovery />
      ) : action == "revokesecretaccess" ? (
        <RevokeSecretAccess />
      ) : action == "createkey" ? (
        <CreateKey />
      ) : action == "swappst" ? (
        <SwapPst />
      ) : action == "sendlendlink" ? (
        <SendLendLink />
      ) : action == "claimlendcryptolink" ? (
        <ClaimLendCryptoLink />
      ) : action == "consumeawxkey" ? (
        <ConsumeAwxKey />
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
