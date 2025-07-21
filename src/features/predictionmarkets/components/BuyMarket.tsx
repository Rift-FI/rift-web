import { ReactNode, useMemo } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStakeTransaction } from "@/hooks/prediction-markets/use-transactions";
import { useDisclosure } from "@/hooks/use-disclosure";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import ActionButton from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import TokenRow from "@/features/token/components/TokenRow";
import { useMarket } from "@/hooks/prediction-markets/use-markets";
import { formatFloatNumber } from "@/lib/utils";

interface Props {
  position: "Yes" | "No";
  marketId: string;
  renderTrigger: () => ReactNode;
}

const buySchema = z.object({
  amount: z.string().optional(),
});

type BUY_SCHEMA_TYPE = z.infer<typeof buySchema>;

export default function BuyMarket(
  props: Props & ReturnType<typeof useDisclosure>
) {
  const { isOpen, onClose, onOpen, renderTrigger, position, marketId } = props;
  const { data: market } = useMarket(marketId);
  const navigate = useNavigate();

  const buy_form = useForm<BUY_SCHEMA_TYPE>({
    resolver: zodResolver(buySchema),
    defaultValues: {
      amount: "",
    },
  });

  const STAKE_AMOUNT = buy_form.watch("amount");

  const stakeTransaction = useStakeTransaction(
    marketId!,
    position === "Yes" ? "YES" : "NO",
    STAKE_AMOUNT!
  );

  const estimate_profit = useMemo(() => {
    if (!STAKE_AMOUNT || STAKE_AMOUNT == "" || !market?.metrics) return 0;

    const amount = parseFloat(STAKE_AMOUNT);
    const price =
      position === "Yes" ? market.metrics.yesPrice : market.metrics.noPrice;

    if (price > 0) {
      const potentialPayout = amount / price;
      return potentialPayout - amount;
    }

    return 0;
  }, [STAKE_AMOUNT]);

  const estimate_roi = useMemo(() => {
    if (!STAKE_AMOUNT || STAKE_AMOUNT == "") return 0;

    const amount = parseFloat(STAKE_AMOUNT);
    return amount > 0 ? (estimate_profit / amount) * 100 : 0;
  }, [STAKE_AMOUNT]);

  const goToSwap = () => {
    onClose();
    navigate("/app/swap");
  };

  const onBuyMarket = () => {
    if (!STAKE_AMOUNT || STAKE_AMOUNT == "") {
      toast.error("Please enter a valid rETH amount");
    } else {
      stakeTransaction
        .execute()
        .then(() => {
          toast.success("The transaction was completed successfully");
          onClose();
          buy_form.reset();
        })
        .catch(() => {
          toast.error(
            "We couldn't process the transaction, do you have enough rETH ?"
          );
        });
    }
  };

  return (
    <Drawer
      modal
      open={isOpen}
      onClose={() => {
        onClose();
      }}
      onOpenChange={(open) => {
        if (open) {
          onOpen();
        } else {
          onClose();
        }
      }}
    >
      <DrawerTrigger asChild>{renderTrigger()}</DrawerTrigger>
      <DrawerContent className="min-h-fit h-[52vh]">
        <DrawerHeader className="hidden">
          <DrawerTitle>Send Crypto</DrawerTitle>
          <DrawerDescription>
            Send crypto to an address or create a Sphere link
          </DrawerDescription>
        </DrawerHeader>

        <div className="w-full h-[52vh] p-4 pt-3 overflow-y-auto">
          <p className="text-sm font-semibold">Buy {position}</p>

          <p className="text-sm font-medium text-text-subtle mt-3">
            Enter Amount (rETH)
          </p>

          <Controller
            control={buy_form.control}
            name="amount"
            render={({ field }) => (
              <div className="w-full mt-2 rounded-md px-3 py-3 bg-app-background border-1 border-border">
                <input
                  {...field}
                  className="w-full h-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm font-medium"
                  placeholder="0.05 rETH"
                  inputMode="numeric"
                />
              </div>
            )}
          />

          <div className="flex flex-row flex-nowrap items-center justify-start overflow-x-auto gap-2 mt-4">
            <Button
              onClick={() => buy_form.setValue("amount", "1")}
              variant="ghost"
              size="sm"
              className="w-fit rounded-full cursor-pointer bg-accent text-text-subtle"
            >
              1 rETH
            </Button>

            <Button
              onClick={() => buy_form.setValue("amount", "0.5")}
              variant="ghost"
              size="sm"
              className="w-fit rounded-full cursor-pointer bg-accent text-text-subtle"
            >
              0.5 rETH
            </Button>

            <Button
              onClick={() => buy_form.setValue("amount", "0.25")}
              variant="ghost"
              size="sm"
              className="w-fit rounded-full cursor-pointer bg-accent text-text-subtle"
            >
              0.25 rETH
            </Button>
          </div>

          <div className="mt-4 rounded-2xl bg-accent">
            <div className="border-b-1 border-app-background">
              <TokenRow
                title="Profit"
                value={`${formatFloatNumber(estimate_profit ?? 0)} rETH`}
              />
            </div>

            <TokenRow
              title="ROI"
              value={`${formatFloatNumber(estimate_roi ?? 0)}%`}
            />
          </div>

          <span
            className="text-accent-primary text-sm font-semibold inline-block mt-2"
            onClick={goToSwap}
          >
            Don't have enough rETH ? Swap Now
          </span>

          <div className="flex flex-row flex-nowrap gap-3 fixed bottom-0 left-0 right-0 p-4 py-2 border-t-1 border-border bg-app-background">
            <ActionButton
              variant={position == "Yes" ? "success" : "danger"}
              className="p-[0.5rem] border-0"
              onClick={onBuyMarket}
              disabled={stakeTransaction.isLoading}
              loading={stakeTransaction.isLoading}
            >
              Buy {position}
            </ActionButton>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
