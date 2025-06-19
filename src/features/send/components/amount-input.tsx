import formatAddress from "@/utils/address-formatter";
import { useFlow } from "../known/flow-context";
import useToken from "@/hooks/data/use-token";
import { z } from "zod";
import {
  Controller,
  ControllerRenderProps,
  useForm,
  UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useTokenBalance from "@/hooks/data/use-token-balance";
import { ReactNode, useMemo } from "react";
import { ChevronLeft, DotIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { WalletToken } from "@/lib/entities";
import useGeckoPrice from "@/hooks/data/use-gecko-price";
import ActionButton from "@/components/ui/action-button";

const amountSchema = z.object({
  amount: z.string(),
});

type AMOUNT_SCHEMA = z.infer<typeof amountSchema>;

export default function AmountInput() {
  const flow = useFlow();
  const address = flow.state?.watch("recipient");
  const token_id = flow.state?.watch("token");
  const chain = flow.state?.watch("chain");
  const token = useToken({
    id: token_id,
    chain: chain,
  });

  const balanceQuery = useTokenBalance({
    token: token.data?.id ?? "",
    chain: token.data?.chain_id,
  });

  const form = useForm<AMOUNT_SCHEMA>({
    resolver: zodResolver(amountSchema),
    defaultValues: {
      amount: "0",
    },
  });

  const handleSetMax = () => {
    const currentBalance = balanceQuery?.data?.amount;

    if (currentBalance) {
      form.setValue("amount", currentBalance.toString());
    }
  };

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

  const handleContinue = () => {
    const currentValue = form.getValues("amount");
    flow?.state?.setValue("amount", currentValue);
    flow?.goToNext();
  };

  const AMOUNT = form.watch("amount");

  const AMOUNT_IS_VALID = useMemo(() => {
    const amount = balanceQuery?.data?.amount ?? 0;
    const parsed = parseFloat(AMOUNT);

    if (Number.isNaN(parsed)) return false;
    if (amount == 0 && parsed > 0) return false;
    if (parsed > amount) return false;
    if (parsed == 0) return false;
    return true;
  }, [AMOUNT, balanceQuery?.data?.amount]);

  return (
    <Controller
      control={form.control}
      name="amount"
      render={({ field }) => {
        let value = parseInt(field.value);
        let ENABLE_BUTTON =
          !Number.isNaN(value) && parseFloat(field.value ?? "0") > 0;
        return (
          <div className="flex flex-col items-center px-5 py-5 gap-5 h-full">
            {/* Header */}
            <div className="flex flex-row items-center gap-x-2 p-3 bg-surface-alt rounded-md w-full">
              <p>To</p>
              {/* TODO: support for rich rendering */}
              <p className="font-semibold text-white p-1 rounded-md">
                {address == "anonymous"
                  ? "Anyone via Sphere Link"
                  : formatAddress(address ?? "")}
              </p>
            </div>
            {/* visual display of amount */}

            <div className="flex flex-col w-full">
              <div className="flex  flex-row items-center justify-center">
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
                <RenderBaseValue form={form} token={token?.data} />
              </div>
            </div>

            <div className="flex flex-row items-center w-full px-2">
              <div className="flex flex-row items-center justify-between w-full">
                <div className="flex flex-row items-center gap-2 ">
                  <img
                    alt={token.data?.name}
                    src={token.data?.icon}
                    className="w-8 h-8"
                  />

                  <div className="flex flex-col">
                    <p className="font-semibold text-white text-lg">
                      {token.data?.name}
                    </p>
                    <p className="text-xs">
                      {balanceQuery?.data?.amount} {token.data?.name}
                    </p>
                  </div>
                </div>

                <div
                  onClick={handleSetMax}
                  className="flex flex-row items-center rounded-full cursor-pointer px-3 py-2 bg-surface-subtle"
                >
                  Use Max
                </div>
              </div>
            </div>

            <div className="flex flex-col flex-1 w-full justify-between">
              <div />
              <div className="flex flex-col w-full gap-5">
                <div className="w-full grid grid-cols-3">
                  {KEYBOARD_BUTTONS?.map((BUTTON, i) => {
                    const handlePress = () => {
                      handleButtonClick(BUTTON.kind, field);
                    };

                    if (BUTTON.render)
                      return BUTTON.render(BUTTON.kind, field, handlePress);

                    return (
                      <div
                        onClick={handlePress}
                        className="flex flex-row items-center justify-center px-2 py-2 cursor-pointer text-3xl font-semibold"
                      >
                        {BUTTON.kind}
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-row items-center w-full">
                  <ActionButton
                    onClick={handleContinue}
                    disabled={!AMOUNT_IS_VALID}
                    variant={"secondary"}
                  >
                    <p className="font-semibold text-xl">Continue</p>
                  </ActionButton>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    />
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
            currency: "USD", // TODO: add support for additional currencies
          }).format(convertedAmount)}
        </div>
      )}
    </div>
  );
}
