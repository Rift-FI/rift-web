import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import TokenSearch from "../components/token-search";
import ChooseToken from "../components/choose-token";
import { useFlow } from "./flow-context";
import { cn } from "@/lib/utils";

const search = z.object({
  searchString: z.string(),
});

type SearchForm = z.infer<typeof search>;

export function SelectToken() {
  const { mode, switchMode } = useFlow();
  const form = useForm<SearchForm>({
    resolver: zodResolver(search),
    defaultValues: {
      searchString: "",
    },
  });

  return (
    <div className="flex flex-col w-full h-full">
      {/* Mode Toggle */}
      <div className="sticky top-0  border-b border-border z-10">
        <div className="flex items-center justify-center p-4">
          <div className="flex bg-muted/30 rounded-lg p-1 w-full max-w-md">
            <button
              onClick={() => switchMode("send-to-address")}
              className={cn(
                "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                mode === "send-to-address"
                  ? "bg-white text-black shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Send to Contact
            </button>
            <button
              onClick={() => switchMode("send-to-anyone")}
              className={cn(
                "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all",
                mode === "send-to-anyone"
                  ? "bg-white text-black shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Send to Anyone
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col w-full items-center px-5 flex-1">
        <div className="space-y-4 w-full mt-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              {mode === "send-to-address"
                ? "Send to Contact"
                : "Send to Anyone"}
            </h2>
            <p className="text-muted-foreground">
              {mode === "send-to-address"
                ? "Choose a token to send to a specific address, username, email, or phone number"
                : "Choose a token to create a payment link anyone can claim"}
            </p>
          </div>

          <Controller
            control={form.control}
            name="searchString"
            render={({ field }) => {
              return (
                <div className="flex flex-col gap-3 w-full h-full">
                  <TokenSearch onSearch={field.onChange} value={field.value} />
                  <ChooseToken searchFilter={field.value} />
                </div>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}
