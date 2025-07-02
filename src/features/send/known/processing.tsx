import { useFlow } from "./flow-context";
import { CgSpinner } from "react-icons/cg";
import useToken from "@/hooks/data/use-token";
import formatAddress from "@/utils/address-formatter";
import { Check, CircleX } from "lucide-react";
import { useEffect } from "react";
import { analyticsLog } from "@/analytics/events";
import { usePlatformDetection } from "@/utils/platform";

export default function Processing() {
  const { sendTransactionMutation,  closeAndReset } = useFlow();

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-5">
      <div />
      {sendTransactionMutation?.isPending ? (
        <PendingState />
      ) : (
        <>
          {sendTransactionMutation?.error ? <ErrorState /> : <SuccessState />}
        </>
      )}
      <div className="w-full flex flex-row items-center justify-center">
        {!sendTransactionMutation?.isPending && (
          <button
            onClick={closeAndReset}
            className="flex flex-row items-center justify-center rounded-full px-2 py-2 flex-1 bg-accent-secondary cursor-pointer active:scale-95"
          >
            <p className="font-semibold text-white">Close</p>
          </button>
        )}
      </div>
    </div>
  );
}

function PendingState() {
  const {  state } = useFlow();

  const stored = state?.getValues();

  const { data } = useToken({
    id: stored?.token!,
    chain: stored?.chain,
  });

  return (
    <div className="flex flex-col w-full items-center justify-center gap-3">
      <div className="flex flex-col px-5 py-5 rounded-full bg-accent-primary/20">
        <CgSpinner className="text-accent-primary w-10 h-10 animate-spin" />
      </div>
      <p className="font-semibold text-white text-3xl">Sending...</p>

      <p className="font-semibold text-xl">
        {stored?.amount} {data?.name}{" "}
        <span className="text-muted-foreground">to</span>{" "}
        {formatAddress(stored?.recipient ?? "")}
      </p>
    </div>
  );
}

function SuccessState() {
  const { state } = useFlow();
  const { telegramUser } = usePlatformDetection();

  const stored = state?.getValues();

  const { data } = useToken({
    id: stored?.token!,
    chain: stored?.chain,
  });

  // Track successful send transaction
  useEffect(() => {
    const telegramId = telegramUser?.id?.toString() || "UNKNOWN USER";
    analyticsLog("SEND", { telegram_id: telegramId });
  }, [telegramUser]);

  return (
    <div className="flex flex-col w-full items-center justify-center gap-3">
      <div className="flex flex-col px-5 py-5 rounded-full bg-success/50">
        <Check className="text-success w-10 h-10 " />
      </div>
      <p className="font-semibold text-success text-3xl">Sent</p>

      <p className="font-semibold text-xl">
        {stored?.amount} {data?.name}{" "}
        <span className="text-muted-foreground"> was successfully sent to</span>{" "}
        {formatAddress(stored?.recipient ?? "")}
      </p>
    </div>
  );
}

function ErrorState() {
  const { state, goBack } = useFlow();

  const stored = state?.getValues();

  const { data } = useToken({
    id: stored?.token!,
    chain: stored?.chain,
  });

  const handleTryAgain = () => {
    goBack("confirm");
  };

  return (
    <div className="flex flex-col w-full items-center justify-center gap-3">
      <div className="flex flex-col px-5 py-5 rounded-full bg-danger/50">
        <CircleX className="text-danger w-10 h-10 " />
      </div>
      <p className="font-semibold text-danger text-3xl">Failed</p>

      <p className="font-semibold text-xl">
        {stored?.amount} {data?.name}{" "}
        <span className="text-muted-foreground"> was not sent to</span>{" "}
        {formatAddress(stored?.recipient ?? "")}
      </p>

      <p
        onClick={handleTryAgain}
        className="font-semibold text-sm text-accent-primary cursor-pointer active:scale-95"
      >
        Try again
      </p>
    </div>
  );
}
