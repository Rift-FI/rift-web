import useChain from "@/hooks/data/use-chain";
import useGeckoPrice from "@/hooks/data/use-gecko-price";
import useTokenBalance from "@/hooks/data/use-token-balance";
import { WalletToken } from "@/lib/entities";
import { formatFloatNumber, formatNumberUsd } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TokenRendererProps {
  token: WalletToken;
  onClick?: (token: WalletToken) => void;
}

export default function TokenRenderer(props: TokenRendererProps) {
  const { token, onClick } = props;

  const balanceQuery = useTokenBalance({
    token: token.id,
    chain: token.chain_id,
    backendId: token.backend_id,
  });

  const { convertedAmount, geckoQuery } = useGeckoPrice({
    token: token.id,
    base: "usd",
    amount: balanceQuery?.data?.amount,
    chainId: token.chain_id,
    contractAddress: token.contract_address,
  });

  const chainQuery = useChain({
    id: token.chain_id,
  });

  const isLoading = balanceQuery?.isLoading || geckoQuery?.isLoading;

  return (
    <div
      onClick={() => {
        onClick?.(token);
      }}
      className="flex flex-row items-center justify-between p-3 rounded-2xl cursor-pointer active:scale-[0.98] bg-surface-subtle/60 hover:bg-surface-subtle transition-colors w-full"
    >
      <div className="flex flex-row items-center gap-x-3">
        <div className="relative flex-shrink-0">
          <img
            src={token.icon}
            alt={token.name}
            className="w-10 h-10 rounded-full"
          />
          {chainQuery.data && (
            <img
              src={chainQuery.data.icon}
              alt={chainQuery.data.name}
              className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full border-2 border-white"
            />
          )}
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold text-text-default">{token.name}</p>
          <p className="text-xs text-text-subtle">
            {chainQuery.data?.description ?? token.description}
          </p>
        </div>
      </div>

      <div className="text-right">
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-14 mb-1 ml-auto" />
            <Skeleton className="h-3 w-10 ml-auto" />
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-text-default">
              {formatFloatNumber(balanceQuery?.data?.amount ?? 0)} {token.name}
            </p>
            <p className="text-xs text-text-subtle">
              {formatNumberUsd(formatFloatNumber(convertedAmount ?? 0))}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
