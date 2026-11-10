import useOwnedTokens from "@/hooks/data/use-owned-tokens";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import RenderToken from "./render-token";
import { WalletToken } from "@/lib/entities";

const searchSchema = z.object({
  search: z.string(),
});

type SEARCH_SCHEMA = z.infer<typeof searchSchema>;

interface Props {
  onSelect: (token: { token: string; chain: string }) => void;
}

export default function FromTokenSelect(props: Props) {
  const { onSelect } = props;
  
  const form = useForm<SEARCH_SCHEMA>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      search: "",
    },
  });

  const search = form.watch("search");

  const tokensQuery = useOwnedTokens(true);

  // Filter tokens to only show stable coins on supported chains
  const filteredTokens = tokensQuery?.data?.filter((token) => {
   // remove filter for now
   
    return true;
  });

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

      {filteredTokens?.length == 0 && (
        <p className="text-sm text-center text-text-subtle mt-16">
          You do not have any stablecoins on supported chains <br />
          Deposit USDC or USDT to experience cross-chain transfers
        </p>
      )}

      <div className="flex flex-col gap-2 mt-9">
        {filteredTokens
          ?.filter((token) => {
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
          ?.map((token, index) => {
            return (
              <RenderToken
                key={token.name + index}
                token={token}
                onPress={handleTokenSelect}
              />
            );
          })}
      </div>
    </div>
  );
}
