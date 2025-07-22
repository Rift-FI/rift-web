import { ReactNode, useEffect, useMemo } from "react";
import { openTelegramLink } from "@telegram-apps/sdk-react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { FaTelegram } from "react-icons/fa6";
import { usePaymentRequest } from "../context";
import { useDisclosure } from "@/hooks/use-disclosure";
import useAnalaytics from "@/hooks/use-analytics";
import useChain from "@/hooks/data/use-chain";
import useToken from "@/hooks/data/use-token";
import { usePlatformDetection } from "@/utils/platform";
import usePaymentLinks from "@/hooks/data/use-payment-link";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import ActionButton from "@/components/ui/action-button";

interface sendRequestLinkProps {
  renderSendReqLink: () => ReactNode;
}

export default function SendRequestLink({
  renderSendReqLink,
}: sendRequestLinkProps) {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { logEvent } = useAnalaytics();
  const { createRequestLinkMutation } = usePaymentLinks();
  const { state } = usePaymentRequest();
  const { isTelegram } = usePlatformDetection();

  const REQUEST_TOKEN = state?.watch("requestToken");
  const REQUEST_TOKEN_CHAIN = state?.watch("requestTokenChain");
  const REQUEST_AMOUNT = state?.watch("requestAmount");

  const { data: CHAIN_INFO } = useChain({ id: REQUEST_TOKEN_CHAIN! });
  const { data: TOKEN_INFO } = useToken({
    id: REQUEST_TOKEN,
    chain: REQUEST_TOKEN_CHAIN,
  });

  const AMOUNT_IS_VALID = useMemo(() => {
    const parsed = parseFloat(REQUEST_AMOUNT!);

    if (Number.isNaN(parsed)) return false;
    if (parsed == 0) return false;
    return true;
  }, [REQUEST_AMOUNT]);

  const handleCopy = () => {
    window.navigator.clipboard.writeText(createRequestLinkMutation.data?.link!);
    logEvent("SEND_PAYMENT_REQUSTLINK");
    toast.success("Link copied to clipboard");
  };

  const onShareTg = () => {
    if (isTelegram) {
      openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(
          createRequestLinkMutation.data?.link!
        )}`
      );
    } else {
      window.open(
        `https://t.me/share/url?url=${encodeURIComponent(
          createRequestLinkMutation.data?.link!
        )}`
      );
    }
  };

  useEffect(() => {
    if (isOpen && AMOUNT_IS_VALID && REQUEST_TOKEN && REQUEST_TOKEN_CHAIN) {
      createRequestLinkMutation
        .mutateAsync({
          amount: REQUEST_AMOUNT!,
          chain: CHAIN_INFO?.backend_id || "",
          token: TOKEN_INFO?.name || "",
        })
        .then(() => {
          logEvent("PAYMENT_REQUEST_CREATED");
        })
        .catch(() => {
          toast.error("We couldn't create the link, please try again");
        });
    }
  }, [isOpen]);

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      onOpenChange={(open) => {
        if (open) {
          onOpen();
        } else {
          onClose();
        }
      }}
    >
      <DrawerTrigger asChild>{renderSendReqLink()}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="hidden">
          <DrawerTitle>Send Link</DrawerTitle>
          <DrawerDescription>Send your crypto request link</DrawerDescription>
        </DrawerHeader>

        <div className="w-full flex flex-col items-center p-2 h-[40vh] gap-4">
          <p className="text-center font-medium">
            Your link was created successfully <br />
            <span className="text-md font-light text-sm">
              Copy & share it to receive{" "}
              <span className="font-medium">{TOKEN_INFO?.name}</span>
            </span>
          </p>

          <div
            onClick={handleCopy}
            className="p-1 pl-2 w-full flex flex-row items-center justify-between cursor-pointer border-1 border-border rounded-[0.625rem]"
          >
            <span className="text-muted-foreground text-ellipsis line-clamp-1 font-medium">
              {createRequestLinkMutation?.data?.link ??
                "Creating a link for you..."}
            </span>
            <div className="p-3 h-full items-center bg-accent rounded-md">
              <Copy className="w-4 h-4" />
            </div>
          </div>

          <ActionButton
            onClick={onShareTg}
            className="p-[0.625rem] rounded-[0.625rem] bg-accent-secondary text-md text-app-background"
          >
            Share on Telegram
            <FaTelegram className="w-5 h-5" />
          </ActionButton>

          <div className="fixed bottom-0 left-0 right-0 p-4 py-2 border-t-1 border-border bg-app-background">
            <ActionButton
              onClick={onClose}
              variant="ghost"
              className="p-[0.5rem] text-md font-medium border-0 bg-secondary hover:bg-surface-subtle transition-all"
            >
              Close
            </ActionButton>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
