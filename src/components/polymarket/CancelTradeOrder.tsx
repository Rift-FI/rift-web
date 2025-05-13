import { JSX } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAppDrawer } from "../../hooks/drawer";
import { useSnackbar } from "../../hooks/snackbar";
import { cancelOrder } from "../../utils/polymarket/orders";
import "../../styles/pages/polymarket/cancelorder.scss";

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

      <button disabled={isPending} onClick={() => onCancelOrder()}>
        Yes Cancel Order
      </button>
    </div>
  );
};
