import { IoArrowUpCircle } from "react-icons/io5";
import { TbQrcode } from "react-icons/tb";
import { FaMoneyBillTransfer } from "react-icons/fa6";
import useChainsBalance from "@/hooks/wallet/use-chains-balances";
import useOwnedTokens from "@/hooks/data/use-owned-tokens";
import { formatNumberUsd } from "@/lib/utils";
import ActionButton from "./components/ActionButton";
import CryptoCard from "./components/CryptoCard";
import BuyCrypto from "@/features/buycrypto";
import SendToKnown from "@/features/send/known";
import ReceiveCrypto from "@/features/receive";
import { TokenSketleton } from "./components/TokenSketleton";
import TokenDrawer from "@/features/token";
import RedirectLinks from "@/features/redirectlinks";

export default function Home() {
  const { data: AGGREGATE_BALANCE } = useChainsBalance();
  const { data: OWNED_TOKENS, isPending: OWNED_TOKENS_PENDING } =
    useOwnedTokens();

  const collectobjectb64 = localStorage.getItem("collectobject");
  const requestobjectb64 = localStorage.getItem("requestobject");

  return (
    <div className="w-full h-full overflow-y-auto mb-18 p-4">
      <div className="text-center mt-8 mb-4">
        <h1 className="text-5xl font-medium mb-2">
          {isNaN(Number(AGGREGATE_BALANCE))
            ? formatNumberUsd(0)
            : formatNumberUsd(AGGREGATE_BALANCE || 0)}
        </h1>
      </div>

      <div className="w-full flex flex-row items-center justify-center gap-3 mb-6">
        <ReceiveCrypto
          renderTrigger={() => (
            <ActionButton
              icon={<TbQrcode className="w-6 h-6" />}
              title="Receive"
            />
          )}
        />

        <SendToKnown
          renderTrigger={() => (
            <ActionButton
              icon={<IoArrowUpCircle className="w-6 h-6" />}
              title="Send"
            />
          )}
        />

        <BuyCrypto
          renderTrigger={() => (
            <ActionButton
              icon={<FaMoneyBillTransfer className="w-6 h-6" />}
              title="Buy"
            />
          )}
        />
      </div>

      <div className="space-y-2">
        {OWNED_TOKENS_PENDING ? (
          <>
            <TokenSketleton />
            <TokenSketleton />
            <TokenSketleton />
          </>
        ) : (
          OWNED_TOKENS?.map((_token, idx) => (
            <TokenDrawer
              key={_token?.id + idx}
              tokenName={_token?.name}
              tokenId={_token?.id}
              chain={_token?.chain_id}
              renderTrigger={() => (
                <CryptoCard tokenid={_token?.id} chain={_token?.chain_id} />
              )}
            />
          ))
        )}
      </div>

      <RedirectLinks
        isOpen={collectobjectb64 !== null || requestobjectb64 !== null}
        redirectType={
          collectobjectb64 !== null
            ? "RECEIVE-FROM-COLLECT-LINK"
            : "SEND-TO-REQUEST-LINK"
        }
      />
    </div>
  );
}
