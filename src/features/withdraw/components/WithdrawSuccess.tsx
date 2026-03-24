import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useWithdraw } from "../context";
import { addPendingWithdrawal } from "@/lib/pending-withdrawal";

export default function WithdrawSuccess() {
  const navigate = useNavigate();
  const { createdOrder, withdrawData, resetWithdraw } = useWithdraw();

  useEffect(() => {
    // Save pending withdrawal so home page shows the banner
    addPendingWithdrawal({
      amount: withdrawData.amount || 0,
      currency: withdrawData.currency || "USD",
      transactionCode: createdOrder?.transactionCode,
    });

    resetWithdraw();
    navigate("/app", { replace: true });
  }, []);

  return null;
}
