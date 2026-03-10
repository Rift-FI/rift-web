import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowUpRight, ArrowLeftRight } from "lucide-react";
import useChain from "@/hooks/data/use-chain";
import useGeckoPrice from "@/hooks/data/use-gecko-price";
import useTokenBalance from "@/hooks/data/use-token-balance";
import { WalletToken } from "@/lib/entities";
import { formatFloatNumber, formatNumberUsd } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

// Chains that support convert (not Lisk - withdraws directly)
const CHAIN_NAME_MAP: Record<string, string> = {
  "42161": "ARBITRUM",
  "8453": "BASE",
  "137": "POLYGON",
  "1": "ETHEREUM",
};

// Convert-supported tokens
const CONVERT_TOKENS = ["USDC", "USDT"];

interface AssetRowProps {
  token: WalletToken;
}

export default function AssetRow({ token }: AssetRowProps) {
  const navigate = useNavigate();
  const [actionOpen, setActionOpen] = useState(false);

  const { data: balance, isLoading: balanceLoading } = useTokenBalance({
    token: token.id,
    chain: token.chain_id,
    backendId: token.backend_id,
  });

  const { convertedAmount, geckoQuery } = useGeckoPrice({
    token: token.id,
    base: "usd",
    amount: balance?.amount,
    chainId: token.chain_id,
    contractAddress: token.contract_address,
  });

  const { data: chain } = useChain({ id: token.chain_id });

  const isLoading = balanceLoading || geckoQuery?.isLoading;

  const canConvert = CONVERT_TOKENS.includes(token.name) && !!CHAIN_NAME_MAP[token.chain_id];

  const handleSend = () => {
    setActionOpen(false);
    const params = new URLSearchParams({
      token: token.id,
      chain: token.chain_id,
      ...(token.backend_id && { backendId: token.backend_id }),
      tokenName: token.name,
      tokenIcon: token.icon,
    });
    navigate(`/app/send/address?${params.toString()}`);
  };

  const handleConvert = () => {
    setActionOpen(false);
    const chainName = CHAIN_NAME_MAP[token.chain_id] || "BASE";
    const params = new URLSearchParams({
      sourceChain: chainName,
      token: token.name,
    });
    navigate(`/app/convert?${params.toString()}`);
  };

  return (
    <>
      <div
        onClick={() => setActionOpen(true)}
        className="flex items-center justify-between p-3 rounded-2xl bg-surface-subtle/60 hover:bg-surface-subtle transition-colors cursor-pointer active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={token.icon}
              alt={token.name}
              className="w-10 h-10 rounded-full"
            />
            {chain && (
              <img
                src={chain.icon}
                alt={chain.name}
                className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full border-2 border-surface-subtle"
              />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-default">
              {token.name}
            </p>
            <p className="text-xs text-text-subtle">
              {chain?.description ?? token.description}
            </p>
          </div>
        </div>

        <div className="text-right">
          {isLoading ? (
            <Skeleton className="h-4 w-16 mb-1 ml-auto" />
          ) : (
            <p className="text-sm font-semibold text-text-default">
              {formatFloatNumber(balance?.amount ?? 0)} {token.name}
            </p>
          )}
          {isLoading ? (
            <Skeleton className="h-3 w-12 ml-auto" />
          ) : (
            <p className="text-xs text-text-subtle">
              {formatNumberUsd(formatFloatNumber(convertedAmount ?? 0))}
            </p>
          )}
        </div>
      </div>

      <Drawer open={actionOpen} onClose={() => setActionOpen(false)} onOpenChange={(o) => !o && setActionOpen(false)}>
        <DrawerContent className="bg-surface">
          <DrawerHeader className="p-4 pb-2">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={token.icon} alt={token.name} className="w-10 h-10 rounded-full" />
                {chain && (
                  <img
                    src={chain.icon}
                    alt={chain.name}
                    className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full border-2 border-surface"
                  />
                )}
              </div>
              <div>
                <DrawerTitle className="text-base">{token.name}</DrawerTitle>
                <p className="text-xs text-text-subtle">{chain?.description ?? token.description}</p>
              </div>
            </div>
          </DrawerHeader>
          <div className="px-4 pb-5 pt-2 space-y-2">
            <button
              onClick={handleSend}
              className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-accent-primary/10 hover:bg-accent-primary/15 transition-colors active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl bg-accent-primary/20 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-accent-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-text-default">Send</p>
                <p className="text-xs text-text-subtle">Send to an address</p>
              </div>
            </button>

            {canConvert && (
              <button
                onClick={handleConvert}
                className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-accent-primary/10 hover:bg-accent-primary/15 transition-colors active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-primary/20 flex items-center justify-center">
                  <ArrowLeftRight className="w-5 h-5 text-accent-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-text-default">Convert</p>
                  <p className="text-xs text-text-subtle">Move to another chain</p>
                </div>
              </button>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
