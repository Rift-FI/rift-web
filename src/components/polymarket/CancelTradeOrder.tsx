import { JSX } from "react";
import { useAppDrawer } from "@/hooks/drawer";
import { useSnackbar } from "@/hooks/snackbar";
import { BottomButtonContainer } from "../Bottom";
import { SubmitButton } from "../global/Buttons";
import { colors } from "@/constants";
import "../../styles/pages/polymarket/cancelorder.scss";

export const CancelTradeOrder = (): JSX.Element => {
  const { closeAppDrawer, secretPurpose } = useAppDrawer();
  const { showsuccesssnack } = useSnackbar();

  const onCancelOrder = () => {
    showsuccesssnack("Your order was cancelled");
    closeAppDrawer();
  };

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
          onclick={onCancelOrder}
        />
      </BottomButtonContainer>
    </div>
  );
};
