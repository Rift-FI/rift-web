import { JSX } from "react";
import { useAppDrawer } from "@/hooks/drawer";
import { useSnackbar } from "@/hooks/snackbar";
import { cancelOrder } from "@/utils/polymarket/orders";
import { BottomButtonContainer } from "../Bottom";
import { SubmitButton } from "../global/Buttons";
import { colors } from "@/constants";
import "../../styles/pages/polymarket/cancelorder.scss";
import { useMutation } from "@tanstack/react-query";

export const CancelTradeOrder = (): JSX.Element => {
  const { closeAppDrawer, keyToshare, secretPurpose } = useAppDrawer();
  const { showsuccesssnack, showerrorsnack } = useSnackbar();

  const { mutate: onCancelOrder, isPending } = useMutation({
    mutationFn: () =>
      cancelOrder(keyToshare as string)
        .then((res) => {
          if (res?.data) {
            showsuccesssnack("Your order was cancelled");
            closeAppDrawer();
          } else {
            showerrorsnack(
              "Sorry, an unexpected error occurred, please try again"
            );
          }
        })
        .catch(() => {
          showerrorsnack(
            "Sorry, an unexpected error occurred, please try again"
          );
        }),
  });

  return (
    <div id="cancelorder">
      <p className="msg">
        Are you sure you want to cancel your order for the market
      </p>

      <p className="span">{secretPurpose}</p>

      <BottomButtonContainer>
        <SubmitButton
          text="Yes Cancel Order"
          sxstyles={{
            padding: "0.625rem",
            borderRadius: "0.5rem",
            color: colors.textprimary,
            textTransform: "capitalize",
            backgroundColor: colors.danger,
          }}
          isLoading={isPending}
          isDisabled={isPending}
          onclick={() => onCancelOrder()}
        />
      </BottomButtonContainer>
    </div>
  );
};
