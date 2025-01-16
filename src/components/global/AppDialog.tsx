import { JSX, SyntheticEvent } from "react";
import { Dialog } from "@mui/material";
import { useAppDialog } from "../../hooks/dialog";
import { LoadingOutput, ErrorOutput, SuccessOutput } from "../dialog/Outputs";
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
      PaperProps={{
        style: {
          width: "90vw",
          height: "14rem",
          padding: "0.5rem",
          borderRadius: "0.625rem",
          backgroundColor: colors.primary,
        },
        elevation: 4,
      }}
      open={dialogOpen}
      onClose={handleClose}
    >
      {action == "loading" || action == "referearn" ? (
        <LoadingOutput />
      ) : action == "success" ? (
        <SuccessOutput />
      ) : (
        <ErrorOutput />
      )}
    </Dialog>
  );
};
