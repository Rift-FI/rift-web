import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import rift from "@/lib/rift";
import {
  type TransactionPlan,
  type BridgeStep,
  type OfframpStep,
  saveTransactionPlan,
  updateTransactionPlan,
  clearTransaction,
} from "@/lib/smart-transaction";
import { previewSignSubmit } from "@/lib/nonCustodial";
import { runV3Offramp } from "@/lib/v3Offramp";


export type SmartTxStatus = "idle" | "executing" | "done" | "failed";

export interface SmartTxState {
  status: SmartTxStatus;
  plan: TransactionPlan | null;
  currentStepIndex: number;
  error: string | null;
}

/**
 * Hook that executes a TransactionPlan step by step:
 * 1. Bridge steps (via bridge API)
 * 2. Offramp steps (via rift SDK)
 */
export default function useSmartTransaction() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SmartTxState>({
    status: "idle",
    plan: null,
    currentStepIndex: -1,
    error: null,
  });

  const invalidateBalances = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["aggregate-balance"] });
    queryClient.invalidateQueries({ queryKey: ["token-balance"] });
    queryClient.invalidateQueries({ queryKey: ["owned-tokens"] });
  }, [queryClient]);

  const executePlan = useCallback(async (plan: TransactionPlan): Promise<boolean> => {
    const authToken = localStorage.getItem("token");
    if (!authToken) {
      toast.error("No authentication token found");
      return false;
    }

    rift.setBearerToken(authToken);

    // Save plan to localStorage
    plan.status = "executing";
    saveTransactionPlan(plan);

    setState({ status: "executing", plan, currentStepIndex: 0, error: null });

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      plan.steps[i].status = "executing";
      setState((s) => ({ ...s, currentStepIndex: i, plan: { ...plan } }));
      updateTransactionPlan(plan);

      try {
        if (step.type === "bridge") {
          await executeBridgeStep(step as BridgeStep, authToken);
        } else {
          await executeOfframpStep(step as OfframpStep, authToken);
        }

        plan.steps[i].status = "done";
        updateTransactionPlan(plan);
      } catch (err: any) {
        plan.steps[i].status = "failed";
        plan.status = "failed";
        updateTransactionPlan(plan);

        const errorMsg = err.message || "Transaction step failed";
        setState({
          status: "failed",
          plan: { ...plan },
          currentStepIndex: i,
          error: errorMsg,
        });
        toast.error(errorMsg);
        return false;
      }
    }

    plan.status = "done";
    updateTransactionPlan(plan);
    setState({ status: "done", plan: { ...plan }, currentStepIndex: plan.steps.length - 1, error: null });

    // Invalidate all balance queries so UI reflects new balances
    invalidateBalances();

    // Clean up after a delay
    setTimeout(() => clearTransaction(plan.id), 5 * 60 * 1000);

    return true;
  }, [invalidateBalances]);

  const reset = useCallback(() => {
    setState({ status: "idle", plan: null, currentStepIndex: -1, error: null });
  }, []);

  return { state, executePlan, reset };
}

async function executeBridgeStep(step: BridgeStep, _authToken: string) {
  void _authToken;
  // Passkey-approved two-phase bridge — see use-bridge.tsx::bridgeV3TwoPhase.
  await previewSignSubmit({
    previewPath: "/v1/bridge/transfers/preview",
    previewBody: {
      sourceChain: step.fromChain,
      destChain: step.toChain,
      token: step.token,
      amount: step.amount.toString(),
    },
    what: `Bridge of ${step.token} from ${step.fromChain}`,
  });
  // Wait a bit for bridge to settle before next step
  await new Promise((resolve) => setTimeout(resolve, 3000));
}

async function executeOfframpStep(step: OfframpStep, authToken: string) {
  rift.setBearerToken(authToken);
  // Offramp / withdraw are passkey-approved two-phase (init → sign → finalize).
  await runV3Offramp({
    token: step.token,
    amount: step.amount,
    currency: step.currency,
    chain: "base",
    recipient: step.recipient,
  });
}
