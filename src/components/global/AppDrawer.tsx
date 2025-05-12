import { JSX, CSSProperties } from "react";
import { Drawer } from "@mui/material";
import { useAppDrawer } from "../../hooks/drawer";
import { CollectCryptoFromLink } from "../forms/CollectCryptoFromLink";
import { RevokeSecretAccess } from "../drawer/RevokeSecretAccess";
import { SendLendLink } from "../drawer/SendLendLink";
import { VerifyTransaction } from "../drawer/VerifyTransaction";
import { TradeYesNo } from "../polymarket/TradeYesNo";
import { ImportKey } from "../drawer/ImportKey";
import { CancelTradeOrder } from "../polymarket/CancelTradeOrder";
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
              action == "tradeyesno"
                ? "65vh"
                : action == "importkey"
                ? "45vh"
                : "39vh",
          },
        },
      }}
      open={drawerOpen}
      onClose={() => closeAppDrawer()}
    >
      {action !== "tradeyesno" && <div style={barstyles} />}

      {action == "collectfromwallet" ? (
        <CollectCryptoFromLink />
      ) : action == "revokesecretaccess" ? (
        <RevokeSecretAccess />
      ) : action == "sendlendlink" ? (
        <SendLendLink />
      ) : action == "verifytxwithotp" ? (
        <VerifyTransaction />
      ) : action == "tradeyesno" ? (
        <TradeYesNo />
      ) : action == "importkey" ? (
        <ImportKey />
      ) : (
        <CancelTradeOrder />
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
  backgroundColor: colors.secondary,
};

const barstyles: CSSProperties = {
  width: "6rem",
  height: "0.25rem",
  marginTop: "0.5rem",
  borderRadius: "0.25rem",
  backgroundColor: colors.divider,
};
