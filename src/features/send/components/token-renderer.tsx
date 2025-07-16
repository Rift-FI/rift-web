import useChain from "@/hooks/data/use-chain";
import useGeckoPrice from "@/hooks/data/use-gecko-price";
import useTokenBalance from "@/hooks/data/use-token-balance";
import { WalletToken } from "@/lib/entities";
import { formatFloatNumber, formatNumberUsd } from "@/lib/utils";

interface TokenRendererProps {
  token: WalletToken;
  onClick?: (token: WalletToken) => void;
}

export default function TokenRenderer(props: TokenRendererProps) {
  const { token, onClick } = props;

  const balanceQuery = useTokenBalance({
    token: token.id,
    chain: token.chain_id,
  });

  const { convertedAmount, geckoQuery } = useGeckoPrice({
    token: token.id,
    base: "usd",
    amount: balanceQuery?.data?.amount,
  });

  const chainQuery = useChain({
    id: token.chain_id,
  });

  return (
    <div
      onClick={() => {
        onClick?.(token);
      }}
      className="flex flex-row items-center justify-between p-2 rounded-[0.75rem] cursor-pointer active:scale-95 bg-secondary hover:bg-surface-subtle w-full"
    >
      <div className="flex flex-row items-center gap-x-2">
        <div className="flex flex-col items-center justify-center relative">
          <img
            src={token.icon}
            alt={token.name}
            className="w-10 h-10 rounded-full"
          />

          {chainQuery.data && (
            <div className="flex flex-row items-center absolute bottom-[0px] right-[0px] w-5 h-5">
              <img
                src={chainQuery.data.icon}
                alt={chainQuery?.data?.name}
                className="rounded-full"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <p className="font-semibold">{token.name}</p>
          <p className="text-xs text-white/75">
            {formatFloatNumber(balanceQuery?.data?.amount ?? 0)} {token.name}
          </p>
        </div>
      </div>

      <div>
        {balanceQuery?.isLoading || geckoQuery?.isLoading ? (
          <div className="flex flex-row rounded-md px-5 py-2 bg-accent animate-pulse"></div>
        ) : (
          <p className="font-semibold text-sm text-white">
            {formatNumberUsd(formatFloatNumber(convertedAmount ?? 0))}
          </p>
        )}
      </div>
    </div>
  );
}
