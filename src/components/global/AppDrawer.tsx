import { JSX, useEffect, CSSProperties } from "react";
import { backButton } from "@telegram-apps/sdk-react";
import { Drawer } from "@mui/material";
import { useAppDrawer } from "../../hooks/drawer";
import { SendEthFromToken } from "../forms/SendFromToken";
import { ConsumeSharedKey } from "../forms/ConsumeKey";
import { QuickActions } from "../drawer/QuickActions";
import { NodeTeeSelector } from "../tabs/security/NodeTeeSelector";
import { colors } from "../../constants";

export const AppDrawer = (): JSX.Element => {
  const { action, drawerOpen, closeAppDrawer } = useAppDrawer();

  const onCloseDrawer = () => {
    if (backButton.isMounted()) {
      backButton.hide();
      backButton.unmount();
    }

    closeAppDrawer();
  };

  const dismissDrawer = () => {
    onCloseDrawer();
  };

  useEffect(() => {
    if (drawerOpen && backButton.isSupported()) {
      backButton.mount();
      backButton.show();
    }

    if (backButton.isVisible()) {
      backButton.onClick(dismissDrawer);
    }

    return () => {
      backButton.offClick(dismissDrawer);
      backButton.unmount();
    };
  }, [drawerOpen]);

  return (
    <Drawer
      anchor={"bottom"}
      elevation={0}
      PaperProps={{
        sx: {
          ...drawerstyles,
          height:
            action == "quickactions" || action == "nodeteeselector"
              ? "60vh"
              : "74vh",
        },
      }}
      open={drawerOpen}
      onClose={() => onCloseDrawer()}
    >
      {action !== "nodeteeselector" && action !== "quickactions" && (
        <div style={barstyles} />
      )}

      {action == "sendfromtoken" ? (
        <SendEthFromToken />
      ) : action == "consumekey" ? (
        <ConsumeSharedKey />
      ) : action == "quickactions" ? (
        <QuickActions />
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
