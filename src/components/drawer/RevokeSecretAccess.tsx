import { JSX } from "react";
import { useAppDrawer } from "../../hooks/drawer";
import { useSnackbar } from "../../hooks/snackbar";
import { SubmitButton } from "../global/Buttons";
import "../../styles/components/drawer/revokesecret.scss";

export const RevokeSecretAccess = (): JSX.Element => {
  const { showsuccesssnack } = useSnackbar();
  const { closeAppDrawer } = useAppDrawer();

  const onRevoke = () => {
    localStorage.setItem("revokedsecret", "true");
    showsuccesssnack("Successfully revoked access to your POE key");
    closeAppDrawer();
  };

  return (
    <div className="revokesecretaccess">
      <p>
        Are you sure you want to revoke access to your POE key ?
        <span>The receipient will not be able to use it again !</span>
      </p>

      <SubmitButton
        text="Yes, Revoke Access"
        sxstyles={{ padding: "0.625rem" }}
        onclick={onRevoke}
      />
    </div>
  );
};
