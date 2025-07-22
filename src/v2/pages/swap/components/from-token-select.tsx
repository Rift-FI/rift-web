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
      </div>

      {tokensQuery?.data?.length == 0 && (
        <p className="text-sm text-center text-text-subtle mt-16">
          You do not have any tokens on Arbitrum <br />
          Deposit now to experience gassless swaps
        </p>
      )}

      <div className="flex flex-col gap-2 mt-9">
        {tokensQuery?.data
          ?.filter((token) => {
            if (token.id == to_token && token.chain_id == to_chain)
              return false;
            if (search.trim().length == 0) return true;
            if (token.name.toLowerCase()?.includes(search.toLowerCase().trim()))
              return true;
            if (
              token.description
                .toLowerCase()
                ?.includes(search.toLowerCase().trim())
            )
              return true;
            return false;
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
