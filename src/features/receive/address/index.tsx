import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { uniqBy } from "lodash";
import { QRCodeSVG } from "qrcode.react";
import { BiCopy } from "react-icons/bi";
import useAnalaytics from "@/hooks/use-analytics";
import useTokens from "@/hooks/data/use-tokens";
import useChain from "@/hooks/data/use-chain";
import useToken from "@/hooks/data/use-token";
import { Button } from "@/components/ui/button";
import ActionButton from "@/components/ui/action-button";
import { shortenString } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function ReceiveFromAddress() {
  const navigate = useNavigate();
  const { logEvent } = useAnalaytics();
  const { data: SUPPORTED_TOKENS } = useTokens({});

  const COMPATIBLE_TOKENS = uniqBy(SUPPORTED_TOKENS, "id");
  const address = localStorage.getItem("address");

  const onCopyAddress = () => {
    navigator.clipboard.writeText(address as string);
    toast.success("Address copied to clipboard");
    logEvent("COPY_ADDRESS");
  };

  const onClose = () => {
    navigate(-1);
  };

  return (
    <motion.div
      initial={{ x: -4, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="w-full h-full p-4"
    >
      <h2 className="text-center text-xl font-bold">Receive Address</h2>

      <div className="w-full flex flex-row items-center justify-center mt-12">
        <div className="w-fit bg-white p-4 rounded-2xl border border-border shadow-sm">
          <QRCodeSVG value={address as string} size={200} />
        </div>
      </div>

      <div className="mt-5 w-full flex flex-col items-center justify-center gap-3">
        <p className="text-center font-semibold text-sm break-words break-all">
          {shortenString(address as string)}
        </p>

        <Button
          variant="secondary"
          onClick={onCopyAddress}
          className="w-1/2 rounded-3xl"
        >
          <BiCopy className="text-current" />
          <span className="text-sm font-semibold">Copy Address</span>
        </Button>
      </div>

      <p className="mt-6 text-center">
        Use your address to receive compatible tokens
      </p>
      <div className="mt-3 pb-2 flex flex-col w-full border-1 border-surface-subtle rounded-lg">
        {COMPATIBLE_TOKENS?.map((_token, idx) => (
          <CompatibleToken
            key={_token?.id}
            tokenId={_token?.id}
            chainId={_token.chain_id}
            isLast={idx == COMPATIBLE_TOKENS?.length - 1}
          />
        ))}
      </div>

      <div className="h-fit fixed bottom-0 left-0 right-0 p-4 py-2 border-t-1 border-border bg-app-background">
        <ActionButton
          onClick={onClose}
          variant="ghost"
          className="p-[0.5rem] text-md font-bold border-0 bg-secondary hover:bg-surface-subtle transition-all"
        >
          Close
        </ActionButton>
      </div>
    </motion.div>
  );
}

const CompatibleToken = (props: {
  tokenId: string;
  chainId: string;
  isLast?: boolean;
}) => {
  const { data: TOKEN } = useToken({ id: props.tokenId, chain: props.chainId });
  const { data: CHAIN } = useChain({ id: props.chainId });

  return (
    <div
      className={cn(
        "w-full border-b-1 border-surface-subtle flex flex-row items-center justify-start p-1 px-2",
        props.isLast ? "border-b-0" : ""
      )}
    >
      <div className="min-w-fit min-h-fit flex items-end">
        <img
          src={TOKEN?.icon}
          alt={TOKEN?.name}
          className="w-10 h-10 rounded-full"
        />
        <img
          src={CHAIN?.icon}
          alt={CHAIN?.name}
          className="w-6 h-6 -translate-x-4 translate-y-1 rounded-full"
        />
      </div>

      <div>
        <span className="font-bold text-sm">{TOKEN?.name}</span>
        <br />
        <span className="text-text-subtle">{CHAIN?.description}</span>
      </div>
    </div>
  );
};
