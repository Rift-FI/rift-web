import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useWithdraw } from "../context";
import { addPendingWithdrawal } from "@/lib/pending-withdrawal";

export default function WithdrawSuccess() {
  const navigate = useNavigate();
  const { createdOrder, withdrawData, resetWithdraw } = useWithdraw();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

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
