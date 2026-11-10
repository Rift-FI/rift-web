import { WalletToken } from "@/lib/entities";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useSwap } from "../swap-context";
import RenderToken from "./render-token";
import { SUPPORTED_CHAINS } from "@/hooks/data/use-lifi-transfer";
import { getTokens } from "@/lib/assets/tokens";
import { useEffect, useState } from "react";

const searchSchema = z.object({
  search: z.string(),
  token: z.string(),
});

type SEARCH_SCHEMA = z.infer<typeof searchSchema>;

interface Props {
  onSelect: (data: { token: string; chain: string }) => void;
}


export default function TokenSearch(props: Props) {
  const { onSelect } = props;
  const { state } = useSwap();

  const from_token = state.watch("from_token");
  const from_chain = state.watch("from_chain");

  const form = useForm<SEARCH_SCHEMA>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      search: "",
      token: "",
    },
  });

  // Get all tokens directly from the static data
  const [allTokens, setAllTokens] = useState<WalletToken[]>([]);
  
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        // Get all tokens and filter for supported chains
        const tokens = await getTokens();
        const supportedTokens = tokens.filter((token) => {
          return Object.values(SUPPORTED_CHAINS).includes(token.chain_id as "8453" | "137" | "42161" | "80085");
        });
        setAllTokens(supportedTokens);
      } catch (error) {
        
      }
    };
    
    fetchTokens();
  }, []);

  function handleTokenSelect(token: WalletToken) {
    form.setValue("token", token.name);

    onSelect({
      token: token.id,
      chain: token.chain_id,
    });
  }
  return (
    <div className="w-full p-4">
      <div className="flex flex-col w-full h-14 bg-app-background fixed top-0 left-0 p-3 mt-1 z-10 border-b-1 border-border">
        <Controller
          control={form.control}
          name="search"
          render={({ field }) => {
            return (
              <div className="flex flex-row items-center justify-between p-2 px-0">
                <input
                  {...field}
                  className="w-full h-full tex-white placeholder:text-muted-foreground outline-none border-none text-sm font-medium text-white"
                  placeholder="Search..."
                />
                <Search className="cursor-pointer text-text-subtle" />
              </div>
            );
          }}
        />
        {/* TODO: temp disable while we wait for @amschel99 to add cross chain logic */}
        {/* <Controller
                    control={form.control}
                    name="chain"
                    render={({field})=>{
                        return (
                            <div className="w-full gap-x-4 flex flex-row items-center justify-center px-5 pl-[145px] py-3 overflow-x-scroll " >
                                {
                                    (chainsQuery?.data as Array<WalletChain> )?.map((chain)=> {
                                        const IS_ACTIVE = chain.chain_id == field.value
                                        return (
                                            <div key={chain.chain_id} 
                                            className={cn(
                                                "flex flex-row px-3 py-2 rounded-full bg-accent hover:bg-accent-secondary cursor-pointer text-xs font-medium active:scale-95",
                                                IS_ACTIVE ? "bg-accent-secondary" : ""
                                                )} 
                                                onClick={()=> {
                                                    field.onChange(chain.chain_id)
                                                }}
                                                >
                                                {chain.description}
                                            </div>
                                        )
                                    })
                                }
                            </div>
                        )
                    }}
                /> */}
      </div>

      <div className="flex flex-col gap-2 mt-9">
        {allTokens
          ?.filter((token: WalletToken) => {
            // Only show tokens on supported chains
            const isSupportedChain = Object.values(SUPPORTED_CHAINS).includes(token.chain_id as "8453" | "137" | "42161" | "80085");
            if (!isSupportedChain) return false;
            
            // Only show stable coins (USDC, USDT)
            const isStablecoin = token.name === "USDC" || token.name === "USDT";
            if (!isStablecoin) return false;
            
            // Don't show the same token that's selected as "from" token
            const isSameAsFrom = from_token == token.id && from_chain == token.chain_id;
            if (isSameAsFrom) return false;
            
            return true;
          })
          ?.map((token: WalletToken, idx: number) => {
            return (
              <RenderToken
                key={token.name + idx}
                token={token}
                onPress={handleTokenSelect}
              />
            );
          })}
      </div>
    </div>
  );
}
