import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { SlCheck } from "react-icons/sl";
import { CgSpinner } from "react-icons/cg";
import useAnalaytics from "@/hooks/use-analytics";
import { useFlow } from "../context";
import ActionButton from "@/components/ui/action-button";

export default function Created() {
  const { signInMutation, signUpMutation } = useFlow();
  const loading = signInMutation?.isPending || signUpMutation?.isPending;
  const error = signInMutation?.error || signUpMutation?.error;
  const { logEvent } = useAnalaytics();

  const navigate = useNavigate();

  const handleOpenWallet = () => {
    logEvent("WALLET_CREATED");

    navigate("/app");
  };

  return (
    <motion.div
      initial={{ x: 4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex flex-col items-center justify-between w-full h-full p-5"
    >
      <div />
      <div className="w-full flex flex-col items-center justify-center p-5">
        {loading ? (
          <WalletCreating />
        ) : (
          <>{error ? <WalletCreationFailed /> : <WalletCreated />}</>
        )}
      </div>

      <div className="flex flex-row items-center justify-center w-full">
        {!loading && !error && (
          <ActionButton
            onClick={handleOpenWallet}
            variant="success"
            className="p-[0.625rem] rounded-[0.75rem]"
          >
            Start using wallet
          </ActionButton>
        )}
      </div>
    </motion.div>
  );
}

function WalletCreated() {
  return (
    <div className="w-full flex flex-col items-center">
      <SlCheck className="text-4xl text-success" />
      <p className="font-medium text-lg text-center mt-2">
        Your wallet is ready
      </p>
      <p className="text-muted-foreground text-center">
        You wallet was created successfully
      </p>
    </div>
  );
}

function WalletCreating() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-center my-2">
        <CgSpinner className="text-accent-primary w-10 h-10 animate-spin" />
      </div>

      <p className="font-medium text-lg text-center">Creating Your wallet</p>

      <p className="text-muted-foreground text-center">
        Doing some cryptographic magic...
      </p>
    </div>
  );
}

function WalletCreationFailed() {
  const { gotBack } = useFlow();
  return (
    <div className="w-full flex flex-col items-center justify-center">
      <p className="font-medium text-lg text-center">Wallet creation failed</p>

      <p className="text-muted-foreground text-center">
        Sorry, an unexpected error occurred...
      </p>

      <button
        onClick={() => gotBack()}
        className="font-medium text-accent-secondary cursor-pointer active:scale-95 mt-4"
      >
        Go back & try again
      </button>
    </div>
  );
}
