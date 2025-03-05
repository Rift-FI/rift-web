import { Fragment, SyntheticEvent } from "react";
import { Snackbar, IconButton } from "@mui/material";
import { useSnackbar } from "../../hooks/snackbar";
import { CheckAlt, Warning } from "../../assets/icons/actions";
import { colors } from "../../constants";

export const SnackBar = (): JSX.Element => {
  const { snackbaropen, snackbarmsg, snacksuccess, hidesnackbar } =
    useSnackbar();

  const handleClose = (_event: SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }

    hidesnackbar();
  };

  const snackAction: JSX.Element = (
    <Fragment>
      <IconButton size="small" aria-label="close">
        {snacksuccess ? (
          <CheckAlt width={24} height={24} color={colors.success} />
        ) : (
          <Warning color={colors.danger} />
        )}
      </IconButton>
    </Fragment>
  );

  return (
    <Snackbar
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      open={snackbaropen}
      message={snackbarmsg}
      autoHideDuration={2000}
      onClose={handleClose}
      action={snackAction}
      sx={{
        zIndex: 4000,
        "& .MuiSnackbarContent-root": {
          backgroundColor: colors.primary,
        },
      }}
    />
  );
};
