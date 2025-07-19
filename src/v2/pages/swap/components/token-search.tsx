import useChains from "@/hooks/data/use-chains";
import useTokens from "@/hooks/data/use-tokens";
import { WalletToken } from "@/lib/entities";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import RenderToken from "./render-token";
import { useSwap } from "../swap-context";

const searchSchema = z.object({
  search: z.string(),
  chain: z.string(),
  token: z.string(),
});

type SEARCH_SCHEMA = z.infer<typeof searchSchema>;

interface Props {
  onSelect: (data: Omit<SEARCH_SCHEMA, "search">) => void;
}

export default function TokenSearch(props: Props) {
  const { onSelect } = props;
  const chainsQuery = useChains();
  const { state } = useSwap();
  const from_token = state.watch("from_token");
  const from_chain = state.watch("from_chain");
  const form = useForm<SEARCH_SCHEMA>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      chain: "42161", // TODO: default to arbitrum while we wait for @amschel99 to add cross chain support
      search: "",
      token: "",
    },
  });

  const chain = form.watch("chain");
  const search = form.watch("search");

  const tokensQuery = useTokens({
    chain,
    search,
    swappable: true,
  });

  function handleTokenSelect(token: WalletToken) {
    form.setValue("token", token.name);
    const values = form.getValues();
    onSelect({
      ...values,
      token: token.id,
    });
  }

  return (
    <div className="w-full flex flex-col  h-full overflow-y-scroll px-5 py-5 relative ">
      <div className="flex flex-col w-full bg-transparent backdrop-blur-2xl fixed top-5 left-0 p-5 shadow-sm ">
        <Controller
          control={form.control}
          name="search"
          render={({ field }) => {
            return (
              <div className="flex flex-row items-center gap-5 bg-accent rounded-md px-3 py-2">
                <input
                  {...field}
                  className="w-full tex-white placeholder:text-muted-foreground outline-none border-none text-lg text-white"
                  placeholder="Search..."
                />
                <Search className="cursor-pointer" />
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
      {/* top holder */}
      <div className="w-full h-[85px]  " />
      <div className="w-full h-full flex flex-col gap-2 pt-5 ">
        {tokensQuery?.data
          ?.filter((token) => {
            if (from_token == token.id && from_chain == token.chain_id)
              return false;
            return true;
          })
          ?.map((token) => {
            return (
              <RenderToken
                key={token.name}
                token={token}
                onPress={handleTokenSelect}
              />
            );
          })}
      </div>
    </div>
  );
}
