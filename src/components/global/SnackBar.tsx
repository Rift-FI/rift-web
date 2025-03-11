import { Fragment } from "react";
import { Snackbar, IconButton } from "@mui/material";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { useSnackbar } from "../../hooks/snackbar";
import { CheckAlt } from "../../assets/icons/actions";
import { FaIcon } from "../../assets/faicon";
import { colors } from "../../constants";

export const SnackBar = (): JSX.Element => {
  const { snackbaropen, snackbarmsg, snacksuccess, hidesnackbar } =
    useSnackbar();

  const handleClose = () => {
    hidesnackbar();
  };

  const snackAction: JSX.Element = (
    <Fragment>
      <IconButton size="small" aria-label="close">
        {snacksuccess ? (
          <CheckAlt width={24} height={24} color={colors.success} />
        ) : (
          <FaIcon faIcon={faTriangleExclamation} color={colors.danger} />
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
