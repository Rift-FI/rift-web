import useOwnedTokens from "@/hooks/data/use-owned-tokens";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import RenderToken from "./render-token";
import { WalletToken } from "@/lib/entities";
import { useSwap } from "../swap-context";

const searchSchema = z.object({
  search: z.string(),
});

type SEARCH_SCHEMA = z.infer<typeof searchSchema>;

interface Props {
  onSelect: (token: { token: string; chain: string }) => void;
}

export default function FromTokenSelect(props: Props) {
  const { onSelect } = props;
  const { state } = useSwap();
  const to_token = state.watch("to_token");
  const to_chain = state.watch("to_chain");
  const form = useForm<SEARCH_SCHEMA>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      search: "",
    },
  });

  const search = form.watch("search");

  const tokensQuery = useOwnedTokens(true);

  const handleTokenSelect = (token: WalletToken) => {
    onSelect({
      token: token.id,
      chain: token.chain_id,
    });
  };

  return (
    <div className="w-full flex flex-col  h-full overflow-y-scroll px-5 py-5 relative ">
      <div className="flex flex-col w-full bg-transparent backdrop-blur-2xl fixed top-5 left-0 p-5 shadow-sm z-100 ">
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
      </div>
      {/* top holder */}
      <div className="w-full h-[85px]  " />
      <div className="w-full h-full flex flex-col gap-2">
        {tokensQuery?.isLoading ? (
          <div className="w-full h-full flex flex-col gap-2">
            <div className="rounded-md bg-surface-alt w-full h-[80px] animate-pulse"></div>
          </div>
        ) : (
          tokensQuery?.data
            ?.filter((token) => {
              if (token.id == to_token && token.chain_id == to_chain)
                return false;
              if (search.trim().length == 0) return true;
              if (
                token.name.toLowerCase()?.includes(search.toLowerCase().trim())
              )
                return true;
              if (
                token.description
                  .toLowerCase()
                  ?.includes(search.toLowerCase().trim())
              )
                return true;
              return false;
            })
            .map((token, i) => {
              return (
                <RenderToken
                  onPress={handleTokenSelect}
                  token={token}
                  key={i}
                />
              );
            })
        )}
        {}
      </div>
    </div>
  );
}
