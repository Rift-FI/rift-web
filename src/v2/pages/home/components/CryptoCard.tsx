import { Skeleton } from "@/components/ui/skeleton";
import useToken from "@/hooks/data/use-token";
import useChain from "@/hooks/data/use-chain";
import useGeckoPrice from "@/hooks/data/use-gecko-price";
import { formatNumberUsd } from "@/lib/utils";
import useTokenBalance from "@/hooks/data/use-token-balance";

interface CryptoCardProps {
  tokenid: string,
  chain: string,
}

export default function CryptoCard({ tokenid, chain }: CryptoCardProps) {
  const { data: TOKEN_INFO, isPending: TOKEN_INFO_PENDING } = useToken({ chain: chain, id: tokenid });
  const { data: CHAIN_INFO, isPending: CHAIN_INFO_LOADING } = useChain({ id: chain });
  const { data: TOKEN_BALANCE, isPending: BALANCE_LOADING } = useTokenBalance({ token: tokenid, chain: chain });

  const tokenBalance = TOKEN_BALANCE?.amount || 0;

  const { convertedAmount, geckoQuery } = useGeckoPrice({ amount: tokenBalance, base: 'usd', token: tokenid })

  const isLoading = BALANCE_LOADING || TOKEN_INFO_PENDING || CHAIN_INFO_LOADING || geckoQuery.isPending;

  return (
    <div className="flex items-center justify-between bg-secondary rounded-xl p-4 py-3 cursor-pointer hover:bg-surface-subtle transition-colors">
      <div className="flex items-center">
        <div className="flex flex-row items-end justify-end">
          <img src={TOKEN_INFO?.icon} alt={TOKEN_INFO?.name} className="w-10 h-10 rounded-full" />
          <span className="bg-white w-6 h-6 p-1 -translate-x-3 translate-y-2 rounded-full">
            <img
              src={CHAIN_INFO?.icon}
              alt={chain}
              className="w-full h-full object-cover"
            />
          </span>
        </div>

        <div>
          <h3 className="font-bold">{TOKEN_INFO?.name}</h3>
          <p className="text-sm font-medium text-gray-400">
            {isLoading ? (
              <Skeleton className="w-16 h-3" />
            ) : (
              <>
                {tokenBalance || 0 || 0} {TOKEN_INFO?.name}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="font-bold">
          {isLoading ? (
            <Skeleton className="w-12 h-4" />
          ) : (
            <>
              {formatNumberUsd(convertedAmount || 0)}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
