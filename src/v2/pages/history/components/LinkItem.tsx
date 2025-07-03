import { Fragment } from "react";
import { PiLink } from "react-icons/pi";
import { toast } from "sonner";
import { SendLinkItem, PaymentRequestItem } from "@stratosphere-network/wallet";
import { useDisclosure } from "@/hooks/use-disclosure";
import usePaymentLinks from "@/hooks/data/use-payment-link";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import ActionButton from "@/components/ui/action-button";
import { dateDistance, formatNumberUsd } from "@/lib/utils";
import useToken from "@/hooks/data/use-token";
import useChain from "@/hooks/data/use-chain";
import useGeckoPrice from "@/hooks/data/use-gecko-price";

interface linkItemProps {
  linkdata?: SendLinkItem;
  requestlinkdata?: PaymentRequestItem;
}

export const LinkItem = ({ linkdata, requestlinkdata }: linkItemProps) => {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { revokePaymentLink, revokeSendLink } = usePaymentLinks();

  const { data: TOKEN_INFO } = useToken({
    name: requestlinkdata?.token ?? "USDC",
  });
  const { data: CHAIN_INFO } = useChain({
    id: requestlinkdata?.chain!,
  });
  const { convertedAmount } = useGeckoPrice({
    base: "usd",
    amount: requestlinkdata?.amount,
    token: TOKEN_INFO?.id,
  });

  const onRevokeSendLink = () => {
    revokeSendLink
      .mutateAsync({ urlId: linkdata?.urlId as string })
      .then(() => {
        toast.success("Successfully revoked link");
        onClose();
      })
      .catch(() => {
        toast.error("Failed to revoke link, please try again");
      });
  };

  const onRevokePaymentLink = () => {
    revokePaymentLink
      .mutateAsync({ nonce: requestlinkdata?.nonce as string })
      .then(() => {
        toast.success("Successfully cancelled payment request");
        onClose();
      })
      .catch(() => {
        toast.error("Failed to cancel payment request, please try again");
      });
  };

  return (
    <Fragment>
      <div
        onClick={onOpen}
        className="bg-surface-subtle rounded-xl p-4 py-3 cursor-pointer hover:bg-surface-subtle transition-colors flex flex-row items-center justify-between"
      >
        <span className="flex justify-center items-center w-10 h-10 rounded-full object-contain mr-2 bg-surface-alt p-2">
          <PiLink className="text-3xl text-accent-primary" />
        </span>

        <div className="flex-1 flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-white font-semibold">
              {Number(
                linkdata ? linkdata?.value : requestlinkdata?.amount
              ).toFixed(4)}

              {requestlinkdata && (
                <span className="ml-2 text-[0.75rem] font-bold bg-text-subtle text-background px-1 p-[0.125rem] rounded-sm">
                  {requestlinkdata?.status}
                </span>
              )}
            </p>
            <span className="text-[rgba(255,255,255,0.5)] text-sm">
              {dateDistance(
                linkdata
                  ? linkdata?.createdAt
                  : (requestlinkdata?.createdAt as string)
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-[#3498db] font-bold text-md">
              {linkdata ? linkdata?.urlId : requestlinkdata?.nonce}
            </p>
          </div>
        </div>
      </div>

      <Drawer
        modal
        open={isOpen}
        onClose={() => {
          onClose();
        }}
        onOpenChange={(open) => {
          if (open) {
            onOpen();
          } else {
            onClose();
          }
        }}
      >
        <DrawerContent className="max-h-[70vh]">
          <DrawerHeader className="hidden">
            <DrawerTitle>Link</DrawerTitle>
            <DrawerDescription>Link Details</DrawerDescription>
          </DrawerHeader>
          <div className="w-full h-full p-4">
            {linkdata && (
              <div>
                <p className="text-center text-sm">
                  {linkdata?.urlId}
                  <br />
                  <span className="font-semibold">
                    Expires {dateDistance(linkdata.expiresAt)}
                  </span>
                </p>

                <div className="my-3 border-t-1 border-border" />

                <ActionButton
                  onClick={onRevokeSendLink}
                  disabled={revokeSendLink.isPending}
                  loading={revokeSendLink.isPending}
                >
                  Revoke Link
                </ActionButton>
              </div>
            )}

            {requestlinkdata && (
              <div>
                <p className="text-center text-sm">
                  {requestlinkdata.nonce}
                  <br />
                  <span className="text-[0.75rem] font-bold bg-text-subtle text-background px-1 p-[0.125rem] rounded-sm">
                    {requestlinkdata?.status}
                  </span>
                </p>

                <div className="flex flex-row my-3 py-3 border-t-1 border-b-1 border-border">
                  <div className="flex flex-row items-end">
                    <img
                      src={TOKEN_INFO?.icon}
                      alt={TOKEN_INFO?.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <span className="bg-white w-5 h-5 -translate-x-4 translate-y-1 rounded-full">
                      <img
                        src={CHAIN_INFO?.icon}
                        alt={CHAIN_INFO?.name}
                        className="w-full h-full rounded-full"
                      />
                    </span>
                  </div>

                  <p>
                    {requestlinkdata?.amount} {requestlinkdata?.token} <br />
                    <span className="font-semibold">
                      {formatNumberUsd(convertedAmount)}
                    </span>
                  </p>
                </div>
                <ActionButton
                  onClick={onRevokePaymentLink}
                  disabled={revokePaymentLink.isPending}
                  loading={revokePaymentLink.isPending}
                >
                  Cancel Payment Request
                </ActionButton>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </Fragment>
  );
};
