import { Fragment } from "react";
import { Snackbar, IconButton, SnackbarCloseReason } from "@mui/material";
import { useSnackbar } from "../../hooks/snackbar";
import { Check, Warning } from "../../assets/icons";
import { colors } from "../../constants";

export const SnackBar = (): JSX.Element => {
  const { snackbaropen, snackbarmsg, snacksuccess, hidesnackbar } =
    useSnackbar();

  const handleClose = (
    _event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === "clickaway" || reason === "escapeKeyDown") {
      return;
    }

    hidesnackbar();
  };

  const snackAction: JSX.Element = (
    <Fragment>
      <IconButton size="small" aria-label="close">
        {snacksuccess ? (
          <Check width={24} height={24} color={colors.success} />
        ) : (
          <Warning width={24} height={24} color={colors.danger} />
        )}
      </IconButton>
    </Fragment>
  );

  return (
    <Snackbar
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      open={snackbaropen}
      message={snackbarmsg}
      autoHideDuration={4000}
      onClose={handleClose}
      action={snackAction}
      sx={{
        zIndex: 4000,
        "& .MuiSnackbarContent-root": {
          borderRadius: "0.5rem",
          backgroundColor: colors.secondary,
        },
      }}
    />
  );
};
