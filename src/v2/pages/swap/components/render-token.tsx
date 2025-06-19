import useChain from "@/hooks/data/use-chain";
import useTokenBalance from "@/hooks/data/use-token-balance";
import { WalletToken } from "@/lib/entities";
import { Info } from "lucide-react";

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
      className="w-full rounded-lg bg-accent px-3 py-2 cursor-pointer active:scale-95 flex flex-row items-center justify-between"
    >
      <div className="flex flex-row items-center gap-x-3">
        <div className="w-12 h-12 relative">
          <img
            src={token.icon}
            alt={token.name}
            className="w-full h-full rounded-full overflow-hidden"
          />

          {chainQuery?.data && !token.is_native && (
            <img
              className="absolute bottom-0 right-0 w-4 h-4 rounded-md"
              src={chainQuery?.data?.icon}
              alt={chainQuery?.data?.name}
            />
          )}
        </div>
        <div className="flex flex-col ">
          <p className="font-semibold text-white">{token.description}</p>
          {balanceQuery?.isLoading ? (
            <div className="px-5 py-2 rounded-full w-fit bg-muted-foreground animate-pulse" />
          ) : (
            <p className="text-muted-foreground">
              <span>
                {balanceQuery?.data?.amount} {token.name}
              </span>
            </p>
          )}
        </div>
      </div>
      <div>
        {/* TODO: Open app token details page */}
        <Info className="cursor-pointer text-muted-foreground" size={16} />
      </div>
    </div>
  );
}
