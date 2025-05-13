import { JSX, SyntheticEvent } from "react";
import { Dialog } from "@mui/material";
import { useAppDialog } from "../../hooks/dialog";
import { LoadingOutput } from "../dialog/Outputs";
import { colors } from "../../constants";

export const AppDialog = (): JSX.Element => {
  const { dialogOpen, action, closeAppDialog } = useAppDialog();

  const handleClose = (
    _event: SyntheticEvent,
    reason: "backdropClick" | "escapeKeyDown"
  ) => {
    if (reason === "backdropClick" || reason === "escapeKeyDown") {
      return;
    }

    closeAppDialog();
  };

  return (
    <Dialog
      disableEscapeKeyDown
      slotProps={{
        paper: {
          style: {
            width: "90vw",
            height: action == "loading" ? "8rem" : "14rem",
            padding: "0.5rem",
            border: `1px solid ${colors.divider}`,
            borderRadius: action == "loading" ? "1rem" : "0.625rem",
            backgroundColor: colors.primary,
          },
          elevation: 0,
        },
      }}
      open={dialogOpen}
      onClose={handleClose}
    >
      <LoadingOutput />
    </Dialog>
  );
};
