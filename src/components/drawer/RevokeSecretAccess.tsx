import { JSX } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { revokeKeyAccess } from "@/utils/api/keys";
import { useAppDrawer } from "../../hooks/drawer";
import { useSnackbar } from "../../hooks/snackbar";
import { SubmitButton } from "../global/Buttons";
import "../../styles/components/drawer/revokesecret.scss";

export const RevokeSecretAccess = (): JSX.Element => {
  const queryclient = useQueryClient();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();
  const { closeAppDrawer, keyToshare, secretPurpose } = useAppDrawer();

  const { mutate: onRevoke, isPending } = useMutation({
    mutationFn: () =>
      revokeKeyAccess(keyToshare as string)
        .then(() => {
          queryclient
            .invalidateQueries({ queryKey: ["mylendkeys"] })
            .then(() => {
              showsuccesssnack("Access revoked successfully");
              closeAppDrawer();
            });
        })
        .catch(() => {
          showerrorsnack("Failed to revoke access, please try again");
          closeAppDrawer();
        }),
  });

  return (
    <div className="revokesecretaccess">
      <p>
        Are you sure you want to revoke access to your {secretPurpose} key ?
        <span>The receipient will not be able to use it again !</span>
      </p>

      <SubmitButton
        text="Yes, Revoke Access"
        sxstyles={{ padding: "0.625rem" }}
        isLoading={isPending}
        isDisabled={isPending}
        onclick={() => onRevoke()}
      />
    </div>
  );
};
