import useChain from "@/hooks/data/use-chain";
import useTokenBalance from "@/hooks/data/use-token-balance";
import { WalletToken } from "@/lib/entities";
import { shortenString } from "@/lib/utils";

interface Props {
  token: WalletToken;
  onPress: (token: WalletToken) => void;
}

export default function RenderToken(props: Props) {
  const { token, onPress } = props;
  const chainQuery = useChain({
    id: token.chain_id,
  });
  const balanceQuery = useTokenBalance({
    token: token.id,
    chain: token.chain_id,
  });

  const handleClick = () => onPress(token);
  return (
    <div
      onClick={handleClick}
      className="w-full rounded-lg bg-accent p-2 cursor-pointer active:scale-95 flex flex-row items-center justify-between"
    >
      <div className="flex flex-row items-center gap-x-3">
        <div className="w-10 h-10 relative">
          <img
            src={token.icon}
            alt={token.name}
            className="w-full h-full rounded-full overflow-hidden"
          />

          {chainQuery?.data && !token.is_native && (
            <img
              className="absolute bottom-0 -right-1 w-5 h-5 rounded-md"
              src={chainQuery?.data?.icon}
              alt={chainQuery?.data?.name}
            />
          )}
        </div>
        <div className="flex flex-col ">
          <p className="text-sm font-medium text-white">
            {token.description?.length > 18
              ? shortenString(token.description, { leading: 10, trailing: 4 })
              : token.description}
          </p>
          {balanceQuery?.isLoading ? (
            <div className="px-5 py-2 rounded-full w-fit bg-muted-foreground animate-pulse" />
          ) : (
            <p className="text-[0.75rem] text-muted-foreground">
              <span>
                {balanceQuery?.data?.amount} {token.name}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
