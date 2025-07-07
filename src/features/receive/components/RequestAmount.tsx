import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  ControllerRenderProps,
  useForm,
  UseFormReturn,
} from "react-hook-form";
import { useReceiveCrypto } from "../context";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { ChevronLeft, DotIcon } from "lucide-react";
import { ReactNode, useMemo } from "react";
import useToken from "@/hooks/data/use-token";
import { cn } from "@/lib/utils";
import { WalletToken } from "@stratosphere-network/wallet";
import usePaymentLinks from "@/hooks/data/use-payment-link";
import useGeckoPrice from "@/hooks/data/use-gecko-price";
import ActionButton from "@/components/ui/action-button";
import useChain from "@/hooks/data/use-chain";
import { toast } from "sonner";
import SendRequestLink from "./SendRequestLink";
import { analyticsLog } from "@/analytics/events";
import { usePlatformDetection } from "@/utils/platform";

const amountSchema = z.object({
  amount: z.string(),
});

type AMOUNT_SCHEMA = z.infer<typeof amountSchema>;

export default function RequestAmount() {
  const { switchRequestStep, state } = useReceiveCrypto();
  const { createRequestLinkMutation } = usePaymentLinks();
  const { telegramUser } = usePlatformDetection();
  const reqTokenId = state?.getValues("requestToken");
  const reqTokenChainId = state?.getValues("requestTokenChain");

  const { data: TOKEN_INFO } = useToken({
    id: reqTokenId,
    chain: reqTokenChainId,
  });
  const { data: CHAIN_INFO } = useChain({ id: reqTokenChainId! });

  const goBack = () => {
    switchRequestStep("token-select");
  };

  const form = useForm<AMOUNT_SCHEMA>({
    resolver: zodResolver(amountSchema),
    defaultValues: {
      amount: "0",
    },
  });

  const handleButtonClick = (
    kind: string,
    field: ControllerRenderProps<AMOUNT_SCHEMA, "amount">
  ) => {
    let value = form.getValues("amount")?.trim() ?? "";
    switch (kind) {
      case "back": {
        if (value == "0") return;
        value = value.length > 0 ? value.slice(0, -1) : "";
        if (value == "") {
          value = "0";
        }
        field.onChange(value);
        break;
      }
      case "dot": {
        if (value.length == 0) return;
        if (value.includes(".")) return;
        field.onChange(value + ".");
        break;
      }
      case "0": {
        if (value.length == 1 && value == "0") return;
        value = value + "0";
        field.onChange(value);
        break;
      }
      default: {
        if (value.length == 1 && value == "0") {
          value = kind;
        } else {
          value = value + kind;
        }
        field.onChange(value);
      }
    }
  };

  const AMOUNT = form.watch("amount");
  const AMOUNT_IS_VALID = useMemo(() => {
    const parsed = parseFloat(AMOUNT);

    if (Number.isNaN(parsed)) return false;
    if (parsed == 0) return false;
    return true;
  }, [AMOUNT]);

  const handleCreateRequestLink = () => {
    const amount = form.getValues("amount");

    if (AMOUNT_IS_VALID && reqTokenId && reqTokenChainId) {
      createRequestLinkMutation.mutate({
        amount: amount,
        chain: CHAIN_INFO?.backend_id!,
        token: TOKEN_INFO?.name!,
      }, {
        onSuccess: () => {
          // Track payment request creation analytics
          const telegramId = telegramUser?.id?.toString() || "UNKNOWN USER";
          analyticsLog("PAYMENT_REQUEST_CREATED", { telegram_id: telegramId });
        }
      });
    } else {
      toast.warning("Sorry, we could create a link");
    }
  };

  return (
    <div className="flex flex-col h-[70vh] space-y-4">
      <div className="flex items-center justify-between px-4">
        <button
          onClick={goBack}
          className="flex flex-row items-center justify-start p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer"
        >
          <MdKeyboardArrowLeft className="text-xl" />
          <span className="text-sm font-medium">Back to tokens</span>
        </button>
      </div>

      <Controller
        control={form.control}
        name="amount"
        render={({ field }) => {
          let value = parseInt(field.value);
          let ENABLE_BUTTON =
            !Number.isNaN(value) && parseFloat(field.value ?? "0") > 0;
          return (
            <div className="flex flex-col items-center px-4 gap-6 flex-1">
              {/* Amount Display */}
              <div className="flex flex-col w-full items-center">
                <div className="flex flex-row items-center justify-center mb-2">
                  <p
                    className={cn(
                      "font-semibold text-6xl ",
                      AMOUNT_IS_VALID || field.value?.replace(".", "") == "0"
                        ? "text-white"
                        : "text-danger"
                    )}
                  >
                    {field.value}
                  </p>
                </div>

                <div className="flex flex-row items-center justify-center w-full">
                  <RenderBaseValue form={form} token={TOKEN_INFO} />
                </div>
              </div>

              {/* Token Info */}
              <div className="flex flex-row items-center w-full justify-center">
                <div className="flex flex-row items-center gap-3">
                  <img
                    alt={TOKEN_INFO?.name}
                    src={TOKEN_INFO?.icon}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="text-center">
                    <p className="text-lg font-semibold">
                      Requesting {TOKEN_INFO?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      on {CHAIN_INFO?.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Keyboard and Button */}
              <div className="flex flex-col w-full gap-6 flex-1 justify-end">
                <div className="w-full grid grid-cols-3 gap-2">
                  {KEYBOARD_BUTTONS?.map((BUTTON, i) => {
                    const handlePress = () => {
                      handleButtonClick(BUTTON.kind, field);
                    };

                    if (BUTTON.render)
                      return BUTTON.render(BUTTON.kind, field, handlePress);

                    return (
                      <div
                        key={i}
                        onClick={handlePress}
                        className="flex flex-row items-center justify-center py-4 cursor-pointer text-3xl font-semibold hover:bg-muted/50 rounded-lg transition-colors"
                      >
                        {BUTTON.kind}
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-row items-center w-full pb-4">
                  <SendRequestLink
                    renderSendReqLink={() => (
                      <ActionButton
                        onClick={handleCreateRequestLink}
                        disabled={!AMOUNT_IS_VALID}
                        variant={"secondary"}
                        loading={createRequestLinkMutation.isPending}
                      >
                        <p className="font-semibold text-xl">
                          {createRequestLinkMutation.isPending
                            ? "Please wait..."
                            : "Create Link"}
                        </p>
                      </ActionButton>
                    )}
                    requestLink={createRequestLinkMutation?.data?.link || ""}
                  />
                </div>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}

interface Button {
  kind: string;
  render?: (
    kind: string,
    field: ControllerRenderProps<AMOUNT_SCHEMA, "amount">,
    onClick?: () => void
  ) => ReactNode;
}

const KEYBOARD_BUTTONS: Array<Button> = [
  {
    kind: "1",
  },
  {
    kind: "2",
  },
  {
    kind: "3",
  },
  {
    kind: "4",
  },
  {
    kind: "5",
  },
  {
    kind: "6",
  },
  {
    kind: "7",
  },
  {
    kind: "8",
  },
  {
    kind: "9",
  },
  {
    kind: "dot",
    render(kind, field, onClick) {
      return (
        <div
          onClick={onClick}
          className="flex flex-row items-center justify-center w-full h-full"
        >
          <DotIcon className="text-white" />
        </div>
      );
    },
  },
  {
    kind: "0",
  },
  {
    kind: "back",
    render(kind, field, onClick) {
      return (
        <div
          onClick={onClick}
          className="flex flex-row items-center justify-center w-full h-full"
        >
          <ChevronLeft />
        </div>
      );
    },
  },
];

interface RenderValueProps {
  form: UseFormReturn<AMOUNT_SCHEMA>;
  token?: WalletToken;
}

function RenderBaseValue(props: RenderValueProps) {
  const { form, token } = props;
  const amount = form.watch("amount");

  const { convertedAmount, geckoQuery } = useGeckoPrice({
    token: token?.id,
    amount: parseFloat(amount),
  });

  return (
    <div className="flex flex-row items-center h-10">
      {!geckoQuery?.data ? null : (
        <div className="font-semibold text-white">
          {Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(convertedAmount)}
        </div>
      )}
    </div>
  );
}
