import { IoArrowUpCircle } from "react-icons/io5";
import { TbQrcode } from "react-icons/tb";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import ActionButton from "./components/ActionButton";
import CryptoCard from "./components/CryptoCard";
import BuyCrypto from "@/features/buycrypto";
import SendToKnown from "@/features/send/known";
import { formatNumberUsd } from "@/lib/utils";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import ReceiveCrypto from "@/features/receive";
import useChainsBalance from "@/hooks/wallet/use-chains-balances";
import useOwnedTokens from "@/hooks/data/use-owned-tokens";
import { TokenSketleton } from "./components/TokenSketleton";

export default function Home() {
  const { onOpen, onClose, isOpen } = useDisclosure();
  const { data: AGGREGATE_BALANCE } = useChainsBalance();
  const { data: OWNED_TOKENS, isPending: OWNED_TOKENS_PENDING } = useOwnedTokens();

  return (
    <div className="w-full h-full overflow-y-auto mb-18 p-4 bg-surface">
      <div className="text-center mt-8 mb-4">
        <h1 className="text-5xl font-medium mb-2">
          {isNaN(Number(AGGREGATE_BALANCE))
            ? formatNumberUsd(0)
            : formatNumberUsd(AGGREGATE_BALANCE || 0)}
        </h1>
      </div>

      <div className="w-full flex flex-row items-center justify-center gap-3 mb-6">
        <ActionButton
          icon={<TbQrcode className="w-6 h-6" />}
          title="Receive"
          onClick={onOpen}
        />

        <SendToKnown renderTrigger={() => (
          <ActionButton icon={<IoArrowUpCircle className="w-6 h-6" />} title="Send" />
        )} />

        <BuyCrypto renderTrigger={() => (
          <ActionButton icon={<FaMoneyBillTransfer className="w-6 h-6" />} title="Buy" />
        )} />
      </div>


      <div className="space-y-2">
        {OWNED_TOKENS_PENDING ? (<TokenSketleton />) : OWNED_TOKENS?.map((_token, idx) => (
          <CryptoCard
            key={_token?.id + idx}
            tokenid={_token?.id}
            chain={_token?.chain_id}
          />
        ))}
      </div>

      <Drawer
        modal
        open={isOpen}
        onClose={() => {
          onClose()
        }}
        onOpenChange={(open) => {
          if (open) {
            onOpen()
          } else {
            onClose()
          }
        }}>
        <DrawerContent className="h-[95vh]" >
          <DrawerTitle className="hidden">Receive Crypto</DrawerTitle>
          <div className="flex flex-col w-full h-full items-center " >
            <ReceiveCrypto />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
