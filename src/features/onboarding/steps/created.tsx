import ActionButton from "@/components/ui/action-button";
import { useFlow } from "../context";
import formatAddress from "@/utils/address-formatter";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router";
import { usePlatformDetection } from "@/utils/platform";
import spherelogo from "@/assets/sphere.png";

export default function Created() {
  const { signInMutation, signUpMutation } = useFlow();
  const loading = signInMutation?.isPending || signUpMutation?.isPending;
  const error = signInMutation?.error || signUpMutation?.error;

  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-5">
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
            onClick={() => {
              // Set the isNewVersion flag when successfully opening wallet
              localStorage.setItem("isNewVersion", "true");
              navigate("/app");
            }}
            variant={"success"}
          >
            Open Wallet
          </ActionButton>
        )}
      </div>
    </div>
  );
}

function WalletCreated() {
  const { isTelegram, telegramUser } = usePlatformDetection();
  const { signInMutation } = useFlow();
  const address = signInMutation?.data?.address;
  return (
    <div className="w-full h-full flex flex-col items-center gap-5">
      <p className="font-semibold text-2xl text-center">
        Your wallet is ready <br />
        {isTelegram && (
          <span className="text-accent-primary">{telegramUser?.username}</span>
        )}
      </p>
      <div className="flex flex-col w-full justify-between h-[250px] rounded-lg shadow-sm bg-accent p-5">
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex flex-row rounded-full overflow-hidden w-[50px] h-[50px]">
            <img src={spherelogo} />
          </div>
          <div>
            <p className="font-semibold">
              {formatAddress(address ?? "0x1223")}
            </p>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between">
          <p className="font-semibold text-muted-foreground">0 ETH</p>
          <div>
            <div className="flex flex-row items-center rounded-full gap-2">
              <CheckCircle2 className="" />
              <p className="font-semibold">Created</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-muted-foreground text-center">
        Your wallet was created on <span className="font-semibold">Sphere</span>
      </p>
    </div>
  );
}

function WalletCreating() {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-5">
      <p className="font-semibold text-2xl text-center">Creating Your wallet</p>
      <div className="flex flex-col w-full justify-between h-[250px] rounded-lg shadow-sm bg-accent p-5 animate-pulse"></div>
      <p className="text-muted-foreground text-center">
        Doing some cryptographic magic...
      </p>
    </div>
  );
}

function WalletCreationFailed() {
  const { gotBack } = useFlow();
  return (
    <div className="w-full flex flex-col items-center justify-center gap-5">
      <p className="font-semibold text-2xl text-center">
        We failed to create your wallet
      </p>
      <div className="flex flex-col w-full justify-between h-[250px] rounded-lg shadow-sm bg-accent p-5 border border-danger"></div>
      <button
        onClick={() => gotBack()}
        className="font-semibold text-accent-secondary cursor-pointer active:scale-95"
      >
        Back
      </button>
    </div>
  );
}
